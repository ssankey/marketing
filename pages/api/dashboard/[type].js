import { getTopCategories } from "lib/models/dashboard/getTopCategories";
import {getTopCustomers }  from "lib/models/dashboard/getTopCustomers"

export default async function handler(req, res) {
    const { type } = req.query;
    const { dateFilter, startDate, endDate, region, customer } = req.query;

    try {
        let data;
        const params = {
            dateFilter,
            startDate,
            endDate,
            region,
            customer
        };

        switch (type) {
            case 'customers':
                data = await getTopCustomers(params);
                console.log('data:', data);
                break;
            case 'categories':
                data = await getTopCategories(params);
                break;
            default:
                return res.status(400).json({ error: 'Invalid data type requested' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}
