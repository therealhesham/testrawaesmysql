import prisma from "../globalprisma";

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      try {
        const { userId } = req.query;

        console.log('Fetching tasks for userId:', userId);

        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
          return res.status(400).json({ error: 'Invalid userId' });
        }

        const tasks = await prisma.tasks.findMany({
          where: {
            userId: parseInt(userId),
          },
          select: {
            taskDeadline: true,
            id: true,
            createdAt: true,
            description: true,
            Title: true,
            isCompleted: true,
          },
        });
        console.log('Found tasks:', tasks.length);
        res.status(200).json(tasks);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks' });
      }
      break;

    case 'POST':
      try {
        const { userId } = req.query;
        const { description, Title, taskDeadline, isCompleted } = req.body;

        console.log('Creating task for userId:', userId);
        console.log('Task data:', { description, Title, taskDeadline, isCompleted });

        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
          return res.status(400).json({ error: 'Invalid userId' });
        }

        // Validate required fields
        if (!description || !Title || !taskDeadline) {
          return res.status(400).json({ error: 'Description, Title, and taskDeadline are required' });
        }

        const task = await prisma.tasks.create({
          data: {
            userId: parseInt(userId),
            description,
            taskDeadline: new Date(taskDeadline).toISOString(),
            Title,
            isCompleted: isCompleted || false,
          },
          select: {
            createdAt: true,
            id: true,
            description: true,
            Title: true,
            taskDeadline: true,
            isCompleted: true,
            userId: true,
          },
        });

        res.status(201).json(task);

      } catch (error) {
        console.error("Error creating task:", error);
        
        res.status(500).json({ error: 'Error creating task' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}