import prisma from "../globalprisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, title, description, taskDeadline } = req.body;

    // Validate required fields
    if (!userId || !title || !description || !taskDeadline) {
      return res.status(400).json({ 
        error: 'userId, title, description, and taskDeadline are required' 
      });
    }

    // Search for random names that don't have tasks assigned
    const randomNames = await findRandomNamesWithoutTasks();

    // Select a random user from the found names (excluding current user)
    let selectedUserId = null;
    if (randomNames.length > 0) {
      // Filter out current user from random names
      const filteredNames = randomNames.filter(name => name.id !== parseInt(userId));
      if (filteredNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredNames.length);
        selectedUserId = filteredNames[randomIndex].id;
      }
    }

    // If no random user found, use current user as fallback
    if (!selectedUserId) {
      selectedUserId = parseInt(userId);
    }

    // Create the task for the selected random user
    const task = await prisma.tasks.create({
      data: {
        userId: selectedUserId,
        description,
        Title: title,
        taskDeadline: new Date(taskDeadline).toISOString(),
        isCompleted: false,
      },
      select: {
        id: true,
        userId: true,
        description: true,
        Title: true,
        taskDeadline: true,
        isCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Mark the selected user in the random names list
    const randomNamesWithSelection = randomNames.map(name => ({
      ...name,
      selected: name.id === selectedUserId
    }));

    const selectedUser = randomNames.find(name => name.id === selectedUserId);
    res.status(201).json({
      task,
      randomNamesFound: randomNamesWithSelection,
      selectedUser: selectedUser,
      message: `تم إنشاء المهمة بنجاح للمستخدم: ${selectedUser ? selectedUser.name : 'المستخدم الحالي'}. تم العثور على ${randomNames.length} اسم عشوائي بدون تاسكات`
    });

  } catch (error) {
    console.error("Error creating task with random search:", error);
    res.status(500).json({ error: 'Error creating task' });
  }
}

// Function to find random names without tasks
async function findRandomNamesWithoutTasks() {
  try {
    // Get all users who don't have any tasks
    const usersWithoutTasks = await prisma.user.findMany({
      where: {
        tasks: {
          none: {}
        }
      },
      select: {
        id: true,
        username: true,
        phonenumber: true,
      },
      take: 10 // Limit to 10 random names
    });

    // Also search in homemaid table for names without tasks
    const homemaidsWithoutTasks = await prisma.homemaid.findMany({
      where: {
        // Check if this homemaid doesn't have any associated tasks
        // We'll check by looking for users with tasks that might be related
        Name: {
          not: null
        }
      },
      select: {
        id: true,
        Name: true,
        phone: true,
      },
      take: 10
    });

    // Get random clients without tasks
    const clientsWithoutTasks = await prisma.client.findMany({
      where: {
        // Clients don't have direct task relationship, but we can find them
        fullname: {
          not: null
        }
      },
      select: {
        id: true,
        fullname: true,
        phonenumber: true,
      },
      take: 10
    });

    // Combine all results and randomize
    const allNames = [
      ...usersWithoutTasks.map(u => ({ type: 'user', name: u.username, phone: u.phonenumber, id: u.id })),
      ...homemaidsWithoutTasks.map(h => ({ type: 'homemaid', name: h.Name, phone: h.phone, id: h.id })),
      ...clientsWithoutTasks.map(c => ({ type: 'client', name: c.fullname, phone: c.phonenumber, id: c.id }))
    ];

    // Shuffle and return first 5
    const shuffled = allNames.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);

  } catch (error) {
    console.error("Error finding random names:", error);
    return [];
  }
}
