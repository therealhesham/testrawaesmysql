import prisma from "../globalprisma";
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { userId } = req.query;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;

        console.log('Fetching tasks for userId:', userIdStr);

        // Validate userId
        if (!userIdStr || isNaN(parseInt(userIdStr))) {
          return res.status(400).json({ error: 'Invalid userId' });
        }

        const tasks = await prisma.tasks.findMany({
          where: {
            OR: [
              { userId: parseInt(userIdStr) }, // المهام المُسندة للمستخدم
              { assignedBy: parseInt(userIdStr) } // المهام المُرسلة من المستخدم
            ]
          },
          select: {
            taskDeadline: true,
            id: true,
            createdAt: true,
            description: true,
            Title: true,
            isCompleted: true,
            userId: true,
            assignedBy: true,
            user: {
              select: {
                username: true,
                id: true
              }
            },
            assignedByUser: {
              select: {
                username: true,
                id: true
              }
            }
          },
        } as any);
        console.log('Found tasks:', tasks.length);
        res.status(200).json(tasks);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching tasks' });
      }
      break;

    case 'POST':
      try {
        const { userId } = req.query;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        const { description, Title, taskDeadline, isCompleted } = req.body;

        console.log('Creating task for userId:', userIdStr);
        console.log('Task data:', { description, Title, taskDeadline, isCompleted });

        // Validate userId
        if (!userIdStr || isNaN(parseInt(userIdStr))) {
          return res.status(400).json({ error: 'Invalid userId' });
        }

        // Validate required fields
        if (!description || !Title || !taskDeadline) {
          return res.status(400).json({ error: 'Description, Title, and taskDeadline are required' });
        }

        const task = await prisma.tasks.create({
          data: {
            userId: parseInt(userIdStr),
            assignedBy: parseInt(userIdStr), // The person creating the task is also the assigner
            description,
            taskDeadline: new Date(taskDeadline).toISOString(),
            Title,
            isCompleted: isCompleted || false,
          } as any,
          select: {
            createdAt: true,
            id: true,
            description: true,
            Title: true,
            taskDeadline: true,
            isCompleted: true,
            userId: true,
            assignedBy: true,
          } as any,
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