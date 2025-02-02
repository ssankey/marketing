

import { verify } from "jsonwebtoken";
import sql from "mssql";
import { queryDatabase } from "../../db";


export default function getDateFilter(dateFilter) {
  switch (dateFilter) {
    case "today":
      return `CONVERT(DATE, T0.DocDate) = CONVERT(DATE, GETDATE())`;

    case "thisWeek":
      return `T0.DocDate >= DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE)) 
                  AND T0.DocDate < DATEADD(DAY, 8 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))`;

    case "thisMonth":
      return `T0.DocDate >= DATEADD(DAY, 1, EOMONTH(GETDATE(), -1)) 
                  AND T0.DocDate <= EOMONTH(GETDATE())`;

    case "lastMonth":
      return `T0.DocDate >= DATEADD(MONTH, -1, DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))) 
                  AND T0.DocDate <= DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))`;

    case "lastWeek":
      return `T0.DocDate >= DATEADD(WEEK, -1, DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE)))
                  AND T0.DocDate < DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE))`;

    default:
      return null;
  }
}

