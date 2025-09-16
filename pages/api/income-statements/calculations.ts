import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    const { from, to, zakatRate = 2.5 } = req.query

    // Build date filter
    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(String(from))
    if (to) dateFilter.lte = new Date(String(to))

    // Get last 6 months for UI display, full year for totals
    let months: string[] = []
    let allMonths: string[] = [] // For totals calculation
    if (!from || !to) {
      const currentYear = new Date().getFullYear()
      
      // Full year for totals calculation
      allMonths = Array.from({ length: 12 }, (_, i) => {
        return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`
      })
      
      // Last 6 months of current year for UI display (in order)
      const today = new Date()
      const currentMonth = today.getMonth() + 1 // 1-based month
      months = []
      
      // Get last 6 months in chronological order
      for (let i = 5; i >= 0; i--) {
        const monthIndex = currentMonth - i
        if (monthIndex > 0) {
          months.push(`${currentYear}-${monthIndex.toString().padStart(2, '0')}`)
        } else {
          // Previous year month
          const prevYear = currentYear - 1
          const prevMonth = 12 + monthIndex
          months.push(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`)
        }
      }
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

    // Calculate monthly data
    const monthlyData: Record<string, Record<string, number>> = {}
    const categoryTotals: Record<string, number> = {}
    const categoryAverages: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}

    // Initialize data structures
    mainCategories.forEach(mainCat => {
      categoryTotals[mainCat.name] = 0
      categoryCounts[mainCat.name] = 0
      monthlyData[mainCat.name] = {}
      
      // Initialize monthly data for all months (full year for totals)
      allMonths.forEach(month => {
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

    // Calculate averages based on full year
    Object.keys(categoryTotals).forEach(cat => {
      categoryAverages[cat] = categoryCounts[cat] > 0 ? categoryTotals[cat] / allMonths.length : 0
    })

    // Calculate financial metrics - more dynamic, database-driven
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
    grossProfit = totalRevenues + directExpenses // directExpenses is already negative

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

    // Calculate monthly breakdowns dynamically based on database categories
    const monthlyBreakdown = {
      revenues: months.map(month => {
        return mainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
      }),
      directExpenses: months.map(month => {
        const directExpensesCategory = mainCategories.find(cat => 
          cat.name === 'المصروفات المباشرة على العقد' && cat.mathProcess === 'subtract'
        )
        return directExpensesCategory ? (monthlyData[directExpensesCategory.name]?.[month] || 0) : 0
      }),
      operationalExpenses: months.map(month => {
        return mainCategories
          .filter(cat => cat.name === 'المصروفات التشغيلية' && cat.mathProcess === 'subtract')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
      }),
      otherOperationalExpenses: months.map(month => {
        return mainCategories
          .filter(cat => cat.name === 'المصروفات الاخرى التشغيلية' && cat.mathProcess === 'subtract')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
      }),
      grossProfit: months.map(month => {
        const monthlyRevenues = mainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
        
        const directExpensesCategory = mainCategories.find(cat => 
          cat.name === 'المصروفات المباشرة على العقد' && cat.mathProcess === 'subtract'
        )
        const monthlyDirectExpenses = directExpensesCategory ? (monthlyData[directExpensesCategory.name]?.[month] || 0) : 0
        
        return monthlyRevenues + monthlyDirectExpenses
      }),
      netProfitBeforeZakat: months.map(month => {
        const monthlyRevenues = mainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
        
        const monthlyExpenses = mainCategories
          .filter(cat => cat.mathProcess === 'subtract')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
        
        return monthlyRevenues + monthlyExpenses
      }),
      netProfitAfterZakat: months.map(month => {
        const monthlyRevenues = mainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
        
        const monthlyExpenses = mainCategories
          .filter(cat => cat.mathProcess === 'subtract')
          .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
        
        const beforeZakat = monthlyRevenues + monthlyExpenses
        const monthlyZakat = Math.max(0, beforeZakat * (Number(zakatRate) / 100))
        return beforeZakat - monthlyZakat
      })
    }

    // Calculate totals and averages dynamically based on database categories
    const totals = {
      revenues: totalRevenues,
      directExpenses: directExpenses,
      operationalExpenses: mainCategories
        .filter(cat => cat.name === 'المصروفات التشغيلية' && cat.mathProcess === 'subtract')
        .reduce((sum, cat) => sum + (categoryTotals[cat.name] || 0), 0),
      otherOperationalExpenses: mainCategories
        .filter(cat => cat.name === 'المصروفات الاخرى التشغيلية' && cat.mathProcess === 'subtract')
        .reduce((sum, cat) => sum + (categoryTotals[cat.name] || 0), 0),
      grossProfit,
      netProfitBeforeZakat,
      zakatAmount,
      netProfitAfterZakat
    }

    const averages = {
      revenues: mainCategories
        .filter(cat => cat.mathProcess === 'add')
        .reduce((sum, cat) => sum + (categoryAverages[cat.name] || 0), 0),
      directExpenses: directExpensesCategory ? (categoryAverages[directExpensesCategory.name] || 0) : 0,
      operationalExpenses: mainCategories
        .filter(cat => cat.name === 'المصروفات التشغيلية' && cat.mathProcess === 'subtract')
        .reduce((sum, cat) => sum + (categoryAverages[cat.name] || 0), 0),
      otherOperationalExpenses: mainCategories
        .filter(cat => cat.name === 'المصروفات الاخرى التشغيلية' && cat.mathProcess === 'subtract')
        .reduce((sum, cat) => sum + (categoryAverages[cat.name] || 0), 0),
      grossProfit: grossProfit / allMonths.length,
      netProfitBeforeZakat: netProfitBeforeZakat / allMonths.length,
      zakatAmount: zakatAmount / allMonths.length,
      netProfitAfterZakat: netProfitAfterZakat / allMonths.length
    }

    return res.status(200).json({
      success: true,
      data: {
        months, // Last 6 months for UI
        allMonths, // Full year for export
        monthlyBreakdown,
        totals,
        averages,
        categories: {
          mainCategories,
          monthlyData,
          categoryTotals,
          categoryAverages
        },
        zakatRate: Number(zakatRate)
      }
    })

  } catch (error) {
    console.error('Financial calculations API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
