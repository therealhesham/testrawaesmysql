import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    const { from, to, zakatRate = 2.5, format = 'excel' } = req.query

    // Build date filter
    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(String(from))
    if (to) dateFilter.lte = new Date(String(to))

    // Get full year months for export
    let months: string[] = []
    if (!from || !to) {
      const currentYear = new Date().getFullYear()
      months = Array.from({ length: 12 }, (_, i) => {
        return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`
      })
    }

    // Advanced query to get all income statements with categories
    const incomeStatements = await prisma.incomeStatement.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        subCategory: {
          include: {
            mainCategory: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Get all main categories with their math process
    const mainCategories = await prisma.mainCategory.findMany({
      include: {
        subs: true
      }
    })

    // Calculate monthly data for full year
    const monthlyData: Record<string, Record<string, number>> = {}
    const categoryTotals: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}

    // Initialize data structures
    mainCategories.forEach(mainCat => {
      categoryTotals[mainCat.name] = 0
      categoryCounts[mainCat.name] = 0
      monthlyData[mainCat.name] = {}
      
      // Initialize monthly data for each month
      months.forEach(month => {
        monthlyData[mainCat.name][month] = 0
      })
    })

    // Process income statements
    incomeStatements.forEach(item => {
      const itemDate = new Date(item.date)
      const monthYear = `${itemDate.getFullYear()}-${(itemDate.getMonth() + 1).toString().padStart(2, '0')}`
      const mainCatName = item.subCategory?.mainCategory?.name || 'غير مصنف'
      const amount = Number(item.amount)
      const mathProcess = item.subCategory?.mainCategory?.mathProcess || 'add'

      // Apply math process based on mainCategory mathProcess
      const processedAmount = mathProcess === 'add' ? amount : -amount

      if (monthlyData[mainCatName]) {
        monthlyData[mainCatName][monthYear] = (monthlyData[mainCatName][monthYear] || 0) + processedAmount
        categoryTotals[mainCatName] += processedAmount
        categoryCounts[mainCatName] += 1
      }
    })

    // Calculate averages
    const categoryAverages: Record<string, number> = {}
    Object.keys(categoryTotals).forEach(cat => {
      categoryAverages[cat] = categoryCounts[cat] > 0 ? categoryTotals[cat] / categoryCounts[cat] : 0
    })

    // Calculate financial metrics dynamically
    let totalRevenues = 0
    let totalExpenses = 0
    let grossProfit = 0
    let totalOperationalExpenses = 0
    let netProfitBeforeZakat = 0

    // Dynamic calculation based on mathProcess from database
    mainCategories.forEach(mainCat => {
      const categoryTotal = categoryTotals[mainCat.name] || 0
      
      if (mainCat.mathProcess === 'add') {
        totalRevenues += categoryTotal
      } else if (mainCat.mathProcess === 'subtract') {
        totalExpenses += categoryTotal
      }
    })

    // Calculate gross profit (revenues - direct expenses)
    const directExpensesCategory = mainCategories.find(cat => 
      cat.name === 'المصروفات المباشرة على العقد' && cat.mathProcess === 'subtract'
    )
    const directExpenses = directExpensesCategory ? categoryTotals[directExpensesCategory.name] || 0 : 0
    grossProfit = totalRevenues + directExpenses

    // Calculate total operational expenses
    const operationalCategories = mainCategories.filter(cat => 
      (cat.name === 'المصروفات التشغيلية' || cat.name === 'المصروفات الاخرى التشغيلية') && 
      cat.mathProcess === 'subtract'
    )
    totalOperationalExpenses = operationalCategories.reduce((sum, cat) => 
      sum + (categoryTotals[cat.name] || 0), 0
    )

    // Calculate net profit before zakat
    netProfitBeforeZakat = grossProfit + totalOperationalExpenses
    const zakatAmount = Math.max(0, netProfitBeforeZakat * (Number(zakatRate) / 100))
    const netProfitAfterZakat = netProfitBeforeZakat - zakatAmount

    // Prepare export data
    const exportData = {
      months,
      mainCategories,
      monthlyData,
      categoryTotals,
      categoryAverages,
      financialMetrics: {
        totalRevenues,
        directExpenses,
        grossProfit,
        totalOperationalExpenses,
        netProfitBeforeZakat,
        zakatAmount,
        netProfitAfterZakat
      },
      zakatRate: Number(zakatRate)
    }

    if (format === 'excel') {
      // For Excel export, return JSON data that can be processed by frontend
      return res.status(200).json({
        success: true,
        data: exportData,
        format: 'excel'
      })
    } else if (format === 'pdf') {
      // For PDF export, return JSON data that can be processed by frontend
      return res.status(200).json({
        success: true,
        data: exportData,
        format: 'pdf'
      })
    } else {
      return res.status(400).json({ success: false, message: 'Invalid format. Use excel or pdf' })
    }

  } catch (error) {
    console.error('Export API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
