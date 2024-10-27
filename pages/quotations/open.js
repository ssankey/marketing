 
import Link from 'next/link';
import React from 'react'
import { Table } from 'react-bootstrap'

export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:3000/api/quotations');
    if (!res.ok) {
      throw new Error(`Failed to fetch data, received status ${res.status}`);
    }
    
    const quotations = await res.json();

    return {
      props: {
        quotations: Array.isArray(quotations) ? quotations : [quotations],
      },
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      props: {
        quotations: [], // Pass empty array on error
      },
    };
  }
}

const Open = ({ quotations }) => {
  return (
    <div>
      <Table striped className="text-nowrap">
        <thead>
          <tr>
            <th scope="col">Quotationr#</th>
            <th scope="col">Date</th>
            <th scope="col">Customer</th>
            <th scope="col">Cat No.</th>
            <th scope="col">Compound</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((quotation) => (
            <tr key={quotation.DocNum}>
              <th scope="row"><Link href={`/quotations/${quotation.DocNum}`}>{quotation.DocNum}</Link></th>
              <td>{new Date(quotation.DocDate[0]).toLocaleDateString()}</td>
              <td>{quotation.CardName}</td>
              <td>{quotation.ItemCode || 'N/A'}</td>
              <td>{quotation.Dscription || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {quotations.length === 0 && (
        <div className="text-center py-4">
          No Quotation available.
        </div>
      )}
    </div>
  );
};


export default Open
