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
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth() + 1 // 1-based month

      // Full year for totals calculation (always 1-12 of current year)
      allMonths = Array.from({ length: 12 }, (_, i) => {
        return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`
      })

      // Last 6 consecutive months including current month
      months = Array.from({ length: 6 }, (_, i) => {
        let month = currentMonth - 5 + i
        let year = currentYear
        if (month <= 0) {
          month += 12
          year -= 1
        }
        return `${year}-${month.toString().padStart(2, '0')}`
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

    // Get all main categories with their subcategories
    const mainCategories = await prisma.mainCategory.findMany({
      include: {
        subs: {
          include: {
            incomeStatement: {
              where: {
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
              }
            }
          }
        }
      }
    })

    // Process main categories and populate subcategory values
    const processedMainCategories = mainCategories.map(mainCat => {
      const processedSubs = mainCat.subs.map(subCat => {
        // Initialize monthly values for the last 6 months
        const values: Record<string, number> = {}
        months.forEach(month => {
          values[month] = 0
        })

        // Process income statements for this subcategory
        subCat.incomeStatement.forEach(statement => {
          const statementDate = new Date(statement.date)
          const monthYear = `${statementDate.getFullYear()}-${(statementDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`
          const amount = Number(statement.amount)
          const mathProcess = mainCat.mathProcess || 'add'

          // Apply math process
          const processedAmount = mathProcess === 'add' ? amount : -amount

          if (values[monthYear] !== undefined) {
            values[monthYear] += processedAmount
          }
        })

        // Calculate total for this subcategory
        const total = Object.values(values).reduce((sum, value) => sum + value, 0)

        return {
          id: subCat.id,
          name: subCat.name,
          mainCategory_id: subCat.mainCategory_id,
          values,
          total
        }
      })

      return {
        id: mainCat.id,
        name: mainCat.name,
        mathProcess: mainCat.mathProcess,
        subCategories: processedSubs
      }
    })

    // Calculate financial metrics from processed data
    let totalRevenues = 0
    let totalExpenses = 0
    let grossProfit = 0
    let totalOperationalExpenses = 0
    let netProfitBeforeZakat = 0

    // Calculate totals from processed main categories
    processedMainCategories.forEach(mainCat => {
      const categoryTotal = mainCat.subCategories.reduce((sum, sub) => sum + sub.total, 0)

      if (mainCat.mathProcess === 'add') {
        totalRevenues += categoryTotal
      } else if (mainCat.mathProcess === 'subtract') {
        totalExpenses += categoryTotal
      }
    })

    // Calculate gross profit (revenues - direct expenses)
    // Find the first subtract category as direct expenses
    const directExpensesCategory = processedMainCategories.find(cat => cat.mathProcess === 'subtract')
    const directExpenses = directExpensesCategory
      ? directExpensesCategory.subCategories.reduce((sum, sub) => sum + sub.total, 0)
      : 0
    grossProfit = totalRevenues + directExpenses // directExpenses is already negative

    // Calculate total operational expenses (all other subtract categories)
    const operationalCategories = processedMainCategories.filter(
      cat => cat.mathProcess === 'subtract' && cat.id !== directExpensesCategory?.id
    )
    totalOperationalExpenses = operationalCategories.reduce(
      (sum, cat) => sum + cat.subCategories.reduce((subSum, sub) => subSum + sub.total, 0),
      0
    )

    // Calculate net profit before zakat
    netProfitBeforeZakat = grossProfit + totalOperationalExpenses
    const zakatAmount = Math.max(0, netProfitBeforeZakat * (Number(zakatRate) / 100))
    const netProfitAfterZakat = netProfitBeforeZakat - zakatAmount

    // Calculate monthly breakdowns from processed data
    const monthlyBreakdown = {
      revenues: months.map(month => {
        return processedMainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )
      }),
        directExpenses: months.map(month => {
          const directExpensesCategory = processedMainCategories.find(cat => cat.mathProcess === 'subtract')
          return directExpensesCategory
            ? directExpensesCategory.subCategories.reduce(
                (sum, sub) => sum + (sub.values[month] || 0),
                0
              )
            : 0
        }),
        operationalExpenses: months.map(month => {
          const operationalCategories = processedMainCategories.filter(
            cat => cat.mathProcess === 'subtract' && cat.id !== directExpensesCategory?.id
          )
          return operationalCategories.reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )
        }),
        otherOperationalExpenses: months.map(month => {
          // For now, we'll use the same operational expenses logic
          // This can be split further if needed based on category order
          const operationalCategories = processedMainCategories.filter(
            cat => cat.mathProcess === 'subtract' && cat.id !== directExpensesCategory?.id
          )
          return operationalCategories.reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )
        }),
      grossProfit: months.map(month => {
        const monthlyRevenues = processedMainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )

        const directExpensesCategory = processedMainCategories.find(cat => cat.mathProcess === 'subtract')
        const monthlyDirectExpenses = directExpensesCategory
          ? directExpensesCategory.subCategories.reduce((sum, sub) => sum + (sub.values[month] || 0), 0)
          : 0

        return monthlyRevenues + monthlyDirectExpenses
      }),
      netProfitBeforeZakat: months.map(month => {
        const monthlyRevenues = processedMainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )

        const monthlyExpenses = processedMainCategories
          .filter(cat => cat.mathProcess === 'subtract')
          .reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )

        return monthlyRevenues + monthlyExpenses
      }),
      netProfitAfterZakat: months.map(month => {
        const monthlyRevenues = processedMainCategories
          .filter(cat => cat.mathProcess === 'add')
          .reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )

        const monthlyExpenses = processedMainCategories
          .filter(cat => cat.mathProcess === 'subtract')
          .reduce(
            (sum, cat) =>
              sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
            0
          )

        const beforeZakat = monthlyRevenues + monthlyExpenses
        const monthlyZakat = Math.max(0, beforeZakat * (Number(zakatRate) / 100))
        return beforeZakat - monthlyZakat
      })
    }

    // Calculate totals and averages from processed data
    const totals = {
      revenues: totalRevenues,
      directExpenses: directExpenses,
      operationalExpenses: operationalCategories.reduce((sum, cat) => sum + cat.subCategories.reduce((subSum, sub) => subSum + sub.total, 0), 0),
      otherOperationalExpenses: operationalCategories.reduce((sum, cat) => sum + cat.subCategories.reduce((subSum, sub) => subSum + sub.total, 0), 0),
      grossProfit,
      netProfitBeforeZakat,
      zakatAmount,
      netProfitAfterZakat
    }

    const averages = {
      revenues: totalRevenues / allMonths.length,
      directExpenses: directExpenses / allMonths.length,
      operationalExpenses:
        operationalCategories.reduce((sum, cat) => sum + cat.subCategories.reduce((subSum, sub) => subSum + sub.total, 0), 0) /
        allMonths.length,
      otherOperationalExpenses:
        operationalCategories.reduce((sum, cat) => sum + cat.subCategories.reduce((subSum, sub) => subSum + sub.total, 0), 0) /
        allMonths.length,
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
        mainCategories: processedMainCategories, // Processed data with values
        zakatRate: Number(zakatRate)
      }
    })
  } catch (error) {
    console.error('Financial calculations API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
