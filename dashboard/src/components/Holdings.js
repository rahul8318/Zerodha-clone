import React, { useState, useEffect } from "react";
import axios from "axios";
import { VerticalGraph } from "./VerticalGraph";

const Holdings = () => {
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/holdings", {
          withCredentials: true,
        });
        setHoldings(res.data);
      } catch (err) {
        console.error("Error fetching holdings:", err);
      }
    };
    fetchHoldings();
  }, []);

  const labels = holdings.map((h) => h.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Stock Price",
        data: holdings.map((h) => h.price),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <>
      <h3>Holdings ({holdings.length})</h3>
      <table>
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Qty</th>
            <th>Avg Cost</th>
            <th>LTP</th>
            <th>Cur Val</th>
            <th>P&L</th>
            <th>Net Chg</th>
            <th>Day Chg</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, idx) => {
            const curValue = h.price * h.qty;
            const isProfit = curValue - h.avg * h.qty >= 0;
            const profClass = isProfit ? "profit" : "loss";
            const dayClass = h.isLoss ? "loss" : "profit";

            return (
              <tr key={idx}>
                <td>{h.name}</td>
                <td>{h.qty}</td>
                <td>{h.avg.toFixed(2)}</td>
                <td>{h.price.toFixed(2)}</td>
                <td>{curValue.toFixed(2)}</td>
                <td className={profClass}>{(curValue - h.avg * h.qty).toFixed(2)}</td>
                <td className={profClass}>{h.net}</td>
                <td className={dayClass}>{h.day}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;
