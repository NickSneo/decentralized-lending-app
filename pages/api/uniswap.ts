import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const query = `
    {
      swaps(first: 10) {
        id
        transaction {
          id
        }
        pair {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          reserveUSD
          volumeUSD
          txCount
          totalSupply
        }
        amount0In
        amount0Out
        amount1In
        amount1Out
        timestamp
      }
    }
  `;

    try {
        const response = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data from Uniswap subgraph' });
    }
}