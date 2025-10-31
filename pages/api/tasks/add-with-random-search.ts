import prisma from "../globalprisma";
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from "jsonwebtoken";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies.authToken
  console.log("token",token);
  const decoded = jwt.verify(token, "rawaesecret") as any
  const findUserByID = await prisma.user.findUnique({where:{id:decoded.id}})
  if(Number(findUserByID?.roleId) !== 1) return res.status(401).json({ error: 'لا تملك صلاحية كافية لاضافة مهمة' });
  try {
    const { 
      userId, 
      title, 
      description, 
      taskDeadline, 
      assignee,
      priority,
      isActive,
      isRepeating,
      repeatType,
      repeatInterval,
      repeatStartDate,
      repeatEndDate,
      repeatEndType,
      repeatCount,
      repeatDays,
      repeatTime
    } = req.body;

    // Validate required fields
    if (!userId || !title || !description || !taskDeadline) {
      return res.status(400).json({ 
        error: 'userId, title, description, and taskDeadline are required' 
      });
    }

    // Use the specific assignee if provided, otherwise fall back to current user
    let selectedUserId = parseInt(userId); // Default to current user
    
    if (assignee && assignee !== '') {
      // If a specific assignee is provided, use that user
      // The assignee field should contain the user ID or username
      if (assignee.startsWith('user')) {
        // Handle cases where assignee is like "user1", "user2", etc.
        const assigneeId = assignee.replace('user', '');
        selectedUserId = parseInt(assigneeId);
      } else {
        // Try to find user by username or ID
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: parseInt(assignee) },
              { username: assignee }
            ]
          }
        });
        if (user) {
          selectedUserId = user.id;
        }
      }
    }

    // Prepare task data
    const taskData: any = {
      userId: selectedUserId,
      assignedBy: parseInt(userId),
      description,
      Title: title,
      taskDeadline: new Date(taskDeadline).toISOString(),
      isCompleted: false,
      priority: priority || null,
      isActive: isActive !== undefined ? isActive : true,
      isRepeating: isRepeating || false,
    };

    // Add repeating fields if task is repeating
    if (isRepeating) {
      taskData.repeatType = repeatType || null;
      taskData.repeatInterval = parseInt(repeatInterval) || 1;
      taskData.repeatStartDate = repeatStartDate ? new Date(repeatStartDate).toISOString() : null;
      taskData.repeatEndDate = repeatEndDate ? new Date(repeatEndDate).toISOString() : null;
      taskData.repeatEndType = repeatEndType || 'never';
      taskData.repeatCount = parseInt(repeatCount) || 1;
      taskData.repeatDays = repeatDays ? JSON.stringify(repeatDays) : null;
      taskData.repeatTime = repeatTime || null;
    }

    // Create the task for the selected user
    const task = await prisma.tasks.create({
      data: taskData,
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
        createdAt: true,
        updatedAt: true,
      } as any,
    });

    // Get the assigned user details
    const assignedUser = await prisma.user.findUnique({
      where: { id: selectedUserId },
      select: { id: true, username: true }
    });

    res.status(201).json({
      task,
      assignedUser: assignedUser,
      message: `تم إنشاء المهمة بنجاح للمستخدم: ${assignedUser ? assignedUser.username : 'المستخدم المحدد'}`
    });

  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: 'Error creating task' });
  }
}
