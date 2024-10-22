import Link from 'next/link';
import React from 'react'
import { Table } from 'react-bootstrap'

export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:3000/api/orders');
    if (!res.ok) {
      throw new Error(`Failed to fetch data, received status ${res.status}`);
    }
    
    const orders = await res.json();

    return {
      props: {
        orders: Array.isArray(orders) ? orders : [orders],
      },
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      props: {
        orders: [], // Pass empty array on error
      },
    };
  }
}

const Open = ({ orders }) => {
  return (
    <div>
      <Table striped className="text-nowrap">
        <thead>
          <tr>
            <th scope="col">Order#</th>
            <th scope="col">Date</th>
            <th scope="col">Customer</th>
            <th scope="col">Cat No.</th>
            <th scope="col">Compound</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.DocNum}>
              <th scope="row"><Link href={`/orders/${order.DocNum}`}>{order.DocNum}</Link></th>
              <td>{new Date(order.DocDate[0]).toLocaleDateString()}</td>
              <td>{order.CardName}</td>
              <td>{order.ItemCode || 'N/A'}</td>
              <td>{order.Dscription || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {orders.length === 0 && (
        <div className="text-center py-4">
          No orders available.
        </div>
      )}
    </div>
  );
};


export default Open
