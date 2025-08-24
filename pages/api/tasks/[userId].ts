import prisma from "../globalprisma";

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      try {
        const { userId } = req.query;

        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
          return res.status(400).json({ error: 'Invalid userId' });
        }

        const tasks = await prisma.tasks.findMany({
          where: {
            userId: parseInt(userId),
          },
          select: {taskDeadline:true,
            id: true,createdAt:true,
            description: true,
            Title: true,
          },
        });
        res.status(200).json(tasks);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks' });
      }
      break;

    case 'POST':
      try {
        const { description, Title,taskDeadline } = req.body;

        // Validate required fields
        if (!description) {
          return res.status(400).json({ error: 'Description is required' });
        }

        // Fetch all users and count their tasks
        const users = await prisma.user.findMany({
          select: {
            id: true,
            _count: {
              select: { tasks: true },
            },
          },
        });

        // Find user with the fewest tasks
        const userWithFewestTasks = users.reduce((min, user) => {
          return user._count.tasks < min._count.tasks ? user : min;
        }, users[0]);

        if (!userWithFewestTasks) {
          return res.status(404).json({ error: 'No users found' });
        }

        const task = await prisma.tasks.create({
          data: {
            userId: userWithFewestTasks.id,
            description,
            taskDeadline: new Date(taskDeadline).toISOString(),
            Title,
          },
          select: {
            createdAt:true,
            id: true,
            description: true,
            Title: true,
            userId: true,
          },
        });

        res.status(201).json(task);

      } catch (error) {
        console.error("Error fetching tasks:", error);
        
        res.status(500).json({ error: 'Error creating task' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}