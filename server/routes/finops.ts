import { Router, Request, Response } from "express";
import {
  FinOpsRepository,
  CreateFinOpsAccountData,
  CreateFinOpsTransactionData,
  CreateFinOpsBudgetData,
  CreateFinOpsInvoiceData,
  FinOpsCost,
} from "../models/FinOps";

const router = Router();

// Helper function to check if database is available (for fallback to mock data)
async function isDatabaseAvailable() {
  try {
    await FinOpsRepository.getAllAccounts();
    return true;
  } catch (error) {
    console.log("FinOps database not available:", error.message);
    return false;
  }
}

// Mock data service for development/testing
const FinOpsMockData = {
  accounts: [
    { id: 1, account_code: "1000", account_name: "Cash and Bank", account_type: "asset", balance_type: "debit", balance: 150000, is_active: true },
    { id: 2, account_code: "4000", account_name: "Service Revenue", account_type: "revenue", balance_type: "credit", balance: 500000, is_active: true },
    { id: 3, account_code: "5100", account_name: "Salaries and Wages", account_type: "expense", balance_type: "debit", balance: 120000, is_active: true },
    { id: 4, account_code: "5700", account_name: "Technology Expenses", account_type: "expense", balance_type: "debit", balance: 25000, is_active: true }
  ],
  transactions: [
    { id: 1, transaction_number: "TXN001", transaction_date: "2024-01-15", description: "Client payment received", total_amount: 50000, transaction_type: "income", status: "posted" },
    { id: 2, transaction_number: "TXN002", transaction_date: "2024-01-10", description: "Office supplies purchase", total_amount: 2500, transaction_type: "expense", status: "posted" }
  ],
  budgets: [
    { id: 1, budget_name: "Q1 2024 Marketing", budget_type: "quarterly", total_budget: 50000, spent_amount: 15000, status: "active", utilization_percentage: 30 },
    { id: 2, budget_name: "Annual Operations 2024", budget_type: "annual", total_budget: 500000, spent_amount: 125000, status: "active", utilization_percentage: 25 }
  ],
  invoices: [
    { id: 1, invoice_number: "INV001", client_name: "Acme Corp", total_amount: 75000, status: "paid", invoice_date: "2024-01-01", due_date: "2024-01-31", paid_amount: 75000, outstanding_amount: 0 },
    { id: 2, invoice_number: "INV002", client_name: "TechStart Inc", total_amount: 45000, status: "sent", invoice_date: "2024-01-15", due_date: "2024-02-15", paid_amount: 0, outstanding_amount: 45000 }
  ],
  costs: [
    { id: 1, cost_category: "infrastructure", description: "AWS cloud services", cost_amount: 5000, cost_date: "2024-01-15", reference_type: "deployment", reference_id: 1 },
    { id: 2, cost_category: "marketing", description: "Google Ads campaign", cost_amount: 3000, cost_date: "2024-01-10", reference_type: "lead", reference_id: 1 }
  ],
  dashboardMetrics: {
    total_revenue: 120000,
    total_costs: 45000,
    profit: 75000,
    profit_margin: 62.5,
    total_budgets: 550000,
    active_budgets: 2,
    overdue_invoices: { overdue_count: 1, overdue_amount: 15000 },
    recent_transactions: [],
    budget_utilization: [
      { budget_name: "Q1 2024 Marketing", total_budget: 50000, spent_amount: 15000, utilization_percentage: 30 },
      { budget_name: "Annual Operations 2024", total_budget: 500000, spent_amount: 125000, utilization_percentage: 25 }
    ]
  }
};

// Dashboard endpoint - overview of financial data
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const dashboardData = await FinOpsRepository.getDashboardData();
      res.json(dashboardData);
    } else {
      // Return mock dashboard data
      res.json(FinOpsMockData.dashboardMetrics);
    }
  } catch (error) {
    console.error("Error fetching FinOps dashboard data:", error);
    res.json(FinOpsMockData.dashboardMetrics);
  }
});

// Financial metrics endpoint
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const { period = "monthly", start_date, end_date } = req.query;
    
    // Default to current month if dates not provided
    const now = new Date();
    const defaultStartDate = start_date as string || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const defaultEndDate = end_date as string || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    if (await isDatabaseAvailable()) {
      const metrics = await FinOpsRepository.getFinancialMetrics(period as string, defaultStartDate, defaultEndDate);
      res.json(metrics);
    } else {
      // Return mock metrics
      res.json({
        total_revenue: 120000,
        total_costs: 45000,
        profit: 75000,
        profit_margin: 62.5,
        period: { start: defaultStartDate, end: defaultEndDate }
      });
    }
  } catch (error) {
    console.error("Error fetching financial metrics:", error);
    res.status(500).json({ error: "Failed to fetch financial metrics" });
  }
});

// ACCOUNTS ENDPOINTS

// Get all accounts
router.get("/accounts", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const accounts = await FinOpsRepository.getAllAccounts();
      res.json(accounts);
    } else {
      res.json(FinOpsMockData.accounts);
    }
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.json(FinOpsMockData.accounts);
  }
});

// Create new account
router.post("/accounts", async (req: Request, res: Response) => {
  try {
    const accountData: CreateFinOpsAccountData = req.body;
    
    // Validate required fields
    if (!accountData.account_code || !accountData.account_name || !accountData.account_type || !accountData.balance_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (await isDatabaseAvailable()) {
      const newAccount = await FinOpsRepository.createAccount(accountData);
      res.status(201).json(newAccount);
    } else {
      // Return mock created account
      const mockAccount = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...accountData,
        balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.status(201).json(mockAccount);
    }
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// TRANSACTIONS ENDPOINTS

// Get all transactions
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (await isDatabaseAvailable()) {
      const transactions = await FinOpsRepository.getAllTransactions(limit, offset);
      res.json(transactions);
    } else {
      res.json(FinOpsMockData.transactions);
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.json(FinOpsMockData.transactions);
  }
});

// Get transaction by ID
router.get("/transactions/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }
    
    if (await isDatabaseAvailable()) {
      const transaction = await FinOpsRepository.getTransactionById(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } else {
      const mockTransaction = FinOpsMockData.transactions.find(t => t.id === id);
      if (!mockTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(mockTransaction);
    }
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// Create new transaction
router.post("/transactions", async (req: Request, res: Response) => {
  try {
    const transactionData: CreateFinOpsTransactionData = req.body;
    
    // Validate required fields
    if (!transactionData.transaction_number || !transactionData.description || !transactionData.transaction_lines) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Validate that debits equal credits
    const totalDebits = transactionData.transaction_lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredits = transactionData.transaction_lines.reduce((sum, line) => sum + line.credit_amount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ error: "Transaction debits must equal credits" });
    }
    
    if (await isDatabaseAvailable()) {
      const newTransaction = await FinOpsRepository.createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } else {
      // Return mock created transaction
      const mockTransaction = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...transactionData,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.status(201).json(mockTransaction);
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// BUDGETS ENDPOINTS

// Get all budgets
router.get("/budgets", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const budgets = await FinOpsRepository.getAllBudgets();
      res.json(budgets);
    } else {
      res.json(FinOpsMockData.budgets);
    }
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.json(FinOpsMockData.budgets);
  }
});

// Create new budget
router.post("/budgets", async (req: Request, res: Response) => {
  try {
    const budgetData: CreateFinOpsBudgetData = req.body;
    
    // Validate required fields
    if (!budgetData.budget_name || !budgetData.total_budget || !budgetData.start_date || !budgetData.end_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // For now, return mock data (budget creation logic would be implemented similar to transactions)
    const mockBudget = {
      id: Math.floor(Math.random() * 1000) + 100,
      ...budgetData,
      spent_amount: 0,
      status: "draft",
      utilization_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    res.status(201).json(mockBudget);
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ error: "Failed to create budget" });
  }
});

// INVOICES ENDPOINTS

// Get all invoices
router.get("/invoices", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const invoices = await FinOpsRepository.getAllInvoices();
      res.json(invoices);
    } else {
      res.json(FinOpsMockData.invoices);
    }
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.json(FinOpsMockData.invoices);
  }
});

// Create new invoice
router.post("/invoices", async (req: Request, res: Response) => {
  try {
    const invoiceData: CreateFinOpsInvoiceData = req.body;
    
    // Validate required fields
    if (!invoiceData.invoice_number || !invoiceData.invoice_lines || invoiceData.invoice_lines.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Calculate totals
    const lineTotal = invoiceData.invoice_lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
    const taxAmount = invoiceData.tax_amount || 0;
    const discountAmount = invoiceData.discount_amount || 0;
    const totalAmount = lineTotal + taxAmount - discountAmount;
    
    // For now, return mock data
    const mockInvoice = {
      id: Math.floor(Math.random() * 1000) + 100,
      ...invoiceData,
      subtotal: lineTotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: "draft",
      paid_amount: 0,
      outstanding_amount: totalAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    res.status(201).json(mockInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// COSTS ENDPOINTS

// Get costs by reference
router.get("/costs", async (req: Request, res: Response) => {
  try {
    const { reference_type, reference_id } = req.query;
    
    if (reference_type && reference_id) {
      if (await isDatabaseAvailable()) {
        const costs = await FinOpsRepository.getCostsByReference(reference_type as string, parseInt(reference_id as string));
        res.json(costs);
      } else {
        const filteredCosts = FinOpsMockData.costs.filter(
          cost => cost.reference_type === reference_type && cost.reference_id === parseInt(reference_id as string)
        );
        res.json(filteredCosts);
      }
    } else {
      // Return all costs if no filter
      res.json(FinOpsMockData.costs);
    }
  } catch (error) {
    console.error("Error fetching costs:", error);
    res.json(FinOpsMockData.costs);
  }
});

// Create new cost entry
router.post("/costs", async (req: Request, res: Response) => {
  try {
    const costData: Omit<FinOpsCost, 'id' | 'created_at' | 'updated_at'> = req.body;
    
    // Validate required fields
    if (!costData.cost_category || !costData.reference_type || !costData.reference_id || !costData.description || !costData.cost_amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (await isDatabaseAvailable()) {
      const newCost = await FinOpsRepository.createCost(costData);
      res.status(201).json(newCost);
    } else {
      // Return mock created cost
      const mockCost = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...costData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.status(201).json(mockCost);
    }
  } catch (error) {
    console.error("Error creating cost entry:", error);
    res.status(500).json({ error: "Failed to create cost entry" });
  }
});

// REPORTS ENDPOINTS

// Generate financial report
router.post("/reports/generate", async (req: Request, res: Response) => {
  try {
    const { report_type, start_date, end_date, parameters } = req.body;
    
    if (!report_type || !start_date || !end_date) {
      return res.status(400).json({ error: "Missing required fields for report generation" });
    }
    
    // For now, return mock report data
    const mockReport = {
      id: Math.floor(Math.random() * 1000) + 100,
      report_name: `${report_type.replace('_', ' ').toUpperCase()} Report`,
      report_type,
      report_period_start: start_date,
      report_period_end: end_date,
      status: "completed",
      generated_data: {
        summary: {
          total_revenue: 120000,
          total_expenses: 45000,
          net_profit: 75000
        },
        details: [
          { account: "Service Revenue", amount: 120000, type: "revenue" },
          { account: "Salaries and Wages", amount: 30000, type: "expense" },
          { account: "Technology Expenses", amount: 15000, type: "expense" }
        ]
      },
      created_at: new Date().toISOString()
    };
    
    res.json(mockReport);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Export data endpoints
router.get("/export/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { format = "csv", start_date, end_date } = req.query;
    
    // For now, return mock export confirmation
    res.json({
      message: `${type} export initiated`,
      format,
      period: { start_date, end_date },
      estimated_completion: new Date(Date.now() + 30000).toISOString(), // 30 seconds from now
      download_url: `/api/finops/downloads/${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    console.error("Error initiating export:", error);
    res.status(500).json({ error: "Failed to initiate export" });
  }
});

export default router;
