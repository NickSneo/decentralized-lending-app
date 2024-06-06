import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';

interface Swap {
    id: string;
    pair: {
        token0: { symbol: string };
        token1: { symbol: string };
        reserveUSD: string;
        volumeUSD: string;
        txCount: string;
        totalSupply: string;
    };
    amount0In: string;
    amount0Out: string;
    amount1In: string;
    amount1Out: string;
    timestamp: string;
}

const Uniswap = (props) => {
    const [data, setData] = useState<Swap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/uniswap');
                const uniswapData = await response.json();
                setData(uniswapData.data.swaps);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatPrice = (reserveUSD: string, totalSupply: string) => {
        if (parseFloat(totalSupply) === 0) return 'N/A';
        return (parseFloat(reserveUSD) / parseFloat(totalSupply)).toFixed(6);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Navbar />
            <h1>Uniswap Swaps</h1>
            <table>
                <thead>
                    <tr>
                        <th>Token Pair</th>
                        <th>Price (USD)</th>
                        <th>Transactions</th>
                        <th>Volume (USD)</th>
                        <th>Makers</th>
                        <th>5m</th>
                        <th>1h</th>
                        <th>6h</th>
                        <th>24h</th>
                        <th>Liquidity</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(swap => (
                        <tr key={swap.id}>
                            <td>{swap.pair.token0.symbol}/{swap.pair.token1.symbol}</td>
                            <td>{formatPrice(swap.pair.reserveUSD, swap.pair.totalSupply)}</td>
                            <td>{swap.pair.txCount}</td>
                            <td>{swap.pair.volumeUSD}</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>{swap.pair.reserveUSD}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Uniswap;