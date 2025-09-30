import prisma from "../globalprisma";
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      taskId, 
      isCompleted, 
      completionDate, 
      completionNotes 
    } = req.body;

    // Validate required fields
    if (!taskId) {
      return res.status(400).json({ 
        error: 'taskId is required' 
      });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
    }
    
    if (completionDate) {
      updateData.completionDate = new Date(completionDate).toISOString();
    }
    
    if (completionNotes !== undefined) {
      updateData.completionNotes = completionNotes;
    }

    // Update the task
    const updatedTask = await prisma.tasks.update({
      where: { id: parseInt(taskId) },
      data: updateData,
      select: {
        id: true,
        userId: true,
        assignedBy: true,
        description: true,
        Title: true,
        taskDeadline: true,
        isCompleted: true,
        priority: true,
        isActive: true,
        isRepeating: true,
        repeatType: true,
        repeatInterval: true,
        repeatStartDate: true,
        repeatEndDate: true,
        repeatEndType: true,
        repeatCount: true,
        repeatDays: true,
        repeatTime: true,
        completionDate: true,
        completionNotes: true,
        createdAt: true,
        updatedAt: true,
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
      }
    });

    res.status(200).json(updatedTask);

  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
