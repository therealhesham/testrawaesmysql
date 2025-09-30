import prisma from 'lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const templates = await prisma.template.findMany();
      // Parse JSON strings back to objects
      const parsedTemplates = templates.map(template => ({
        ...template,
        dynamicFields: template.dynamicFields ? JSON.parse(template.dynamicFields) : null,
        defaultValues: template.defaultValues ? JSON.parse(template.defaultValues) : null
      }));
      res.status(200).json(parsedTemplates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  } else if (req.method === 'POST') {
    const { title, content, type, dynamicFields, defaultValues } = req.body;

    if (!title || !content || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const newTemplate = await prisma.template.create({
        data: { 
          title, 
          content, 
          type,
          dynamicFields: dynamicFields ? JSON.stringify(dynamicFields) : null,
          defaultValues: defaultValues ? JSON.stringify(defaultValues) : null
        },
      });
      res.status(201).json(newTemplate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create template' });
    }
  } else if (req.method === 'PUT') {
    const { id, title, content, type, dynamicFields, defaultValues } = req.body;

    if (!id || !title || !content || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const updatedTemplate = await prisma.template.update({
        where: { id: Number(id) },
        data: { 
          title, 
          content, 
          type,
          dynamicFields: dynamicFields ? JSON.stringify(dynamicFields) : null,
          defaultValues: defaultValues ? JSON.stringify(defaultValues) : null
        },
      });
      res.status(200).json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update template' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}