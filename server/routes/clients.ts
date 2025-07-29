import { Router, Request, Response } from 'express';
import { ClientRepository, CreateClientData, UpdateClientData } from '../models/Client';
import { MockDataService } from '../services/mockData';

const router = Router();

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await ClientRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}

// Get all clients
router.get('/', async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;

    let clients;
    if (await isDatabaseAvailable()) {
      if (salesRep) {
        const salesRepId = parseInt(salesRep as string);
        if (isNaN(salesRepId)) {
          return res.status(400).json({ error: 'Invalid sales rep ID' });
        }
        clients = await ClientRepository.findBySalesRep(salesRepId);
      } else {
        clients = await ClientRepository.findAll();
      }
    } else {
      clients = await MockDataService.getAllClients();
      if (salesRep) {
        const salesRepId = parseInt(salesRep as string);
        clients = clients.filter(client => client.sales_rep_id === salesRepId);
      }
    }

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    // Fallback to mock data
    const clients = await MockDataService.getAllClients();
    res.json(clients);
  }
});

// Get client statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await ClientRepository.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Failed to fetch client statistics' });
  }
});

// Get client by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const client = await ClientRepository.findById(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
router.post('/', async (req: Request, res: Response) => {
  try {
    const clientData: CreateClientData = req.body;
    
    // Validate required fields
    if (!clientData.client_name || !clientData.contact_person || !clientData.email) {
      return res.status(400).json({ error: 'Missing required fields: client_name, contact_person, email' });
    }

    // Validate priority if provided
    if (clientData.priority && !['low', 'medium', 'high', 'urgent'].includes(clientData.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const client = await ClientRepository.create(clientData);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const clientData: UpdateClientData = req.body;
    
    // Validate priority if provided
    if (clientData.priority && !['low', 'medium', 'high', 'urgent'].includes(clientData.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    // Validate status if provided
    if (clientData.status && !['active', 'inactive', 'onboarding', 'completed'].includes(clientData.status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const client = await ClientRepository.update(id, clientData);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const success = await ClientRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
