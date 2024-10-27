import { getMonthlySalesAndCOGS, getTopCategoriesMonthly, getTopCustomers, getTotalOpenOrders } from "lib/models/dashboard";
import Dashboard from "./dashboard";

const Home = ({ salesData, topCustomers, topCategories, openOrders }) => {
    return (
        <Dashboard 
            salesData={salesData} 
            topCustomers={topCustomers} 
            topCategories={topCategories} 
            openOrders={openOrders} 
        />
    );
};

export default Home;

export async function getServerSideProps() {
    try {
        const [salesData, topCustomers, topCategories, openOrders] = await Promise.all([
            getMonthlySalesAndCOGS(),
            getTopCustomers(),
            getTopCategoriesMonthly(),
            getTotalOpenOrders(),
        ]);

        return {
            props: {
                salesData: salesData || [],
                topCustomers: topCustomers || [],
                topCategories: topCategories || [],
                openOrders: openOrders[0]?.TotalOpenOrders || 0,
            },
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return {
            props: {
                salesData: [],
                topCustomers: [],
                topCategories: [],
                openOrders: 0,
            },
        };
    }
}