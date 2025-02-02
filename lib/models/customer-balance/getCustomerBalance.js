import sql from "mssql";
import { queryDatabase } from "../../db";

export async function getCustomerBalances() {

  const query = `
    SELECT TOP 10
    t1.cardcode, 
    t1.cardname,
    (SUM(T0.Debit) - SUM(T0.Credit)) AS Balance
    FROM JDT1 t0
    LEFT OUTER JOIN OCRD t1 ON T0.ShortName = T1.CardCode  
    WHERE T0.ShortName LIKE 'C%%'
    GROUP BY t1.cardname, t1.cardcode
    HAVING (SUM(T0.Debit) - SUM(T0.Credit)) > 0
    ORDER BY Balance DESC;

  `;

  return await queryDatabase(query);
}
