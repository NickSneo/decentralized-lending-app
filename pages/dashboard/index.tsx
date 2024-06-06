import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ethers, JsonRpcSigner } from 'ethers';

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

const Dashboard = () => {
    const { data: session, status } = useSession();
    const [account, setAccount] = useState<string | null>(null);
    const [data, setData] = useState<Swap[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return; // Wait for session to load
        if (!session) {
            router.push('/auth/signin');
        } else {
            checkWalletConnection();
        }
    }, [session, status]);

    const checkWalletConnection = async () => {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts: JsonRpcSigner[] = await provider.listAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0].address);
                } else {
                    router.push('/auth/wallet-connect');
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        } else {
            console.log('MetaMask is not installed');
        }
    };

    useEffect(() => {
        if (!account) return;
        async function fetchData() {
            try {
                const response = await fetch('/api/uniswap');
                const uniswapData = await response.json();
                // const responsePancake = await fetch('/api/pancakeswap');
                // const pancakeData = await responsePancake.json();
                setData([...uniswapData.data.swaps]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [account]);

    const formatPrice = (reserveUSD: string, totalSupply: string) => {
        if (parseFloat(totalSupply) === 0) return 'N/A';
        return (parseFloat(reserveUSD) / parseFloat(totalSupply)).toFixed(6);
    };

    if (status === 'loading' || loading) {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    if (!session || !account) return null;

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6 text-center">All Swaps</h1>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="px-4 py-2">Token Pair</th>
                                <th className="px-4 py-2">Price (USD)</th>
                                <th className="px-4 py-2">Transactions</th>
                                <th className="px-4 py-2">Volume (USD)</th>
                                <th className="px-4 py-2">Makers</th>
                                <th className="px-4 py-2">5m</th>
                                <th className="px-4 py-2">1h</th>
                                <th className="px-4 py-2">6h</th>
                                <th className="px-4 py-2">24h</th>
                                <th className="px-4 py-2">Liquidity</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {data.map(swap => (
                                <tr key={swap.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="px-4 py-2">{swap.pair.token0.symbol}/{swap.pair.token1.symbol}</td>
                                    <td className="px-4 py-2">{formatPrice(swap.pair.reserveUSD, swap.pair.totalSupply)}</td>
                                    <td className="px-4 py-2">{swap.pair.txCount}</td>
                                    <td className="px-4 py-2">{swap.pair.volumeUSD}</td>
                                    <td className="px-4 py-2">N/A</td>
                                    <td className="px-4 py-2">N/A</td>
                                    <td className="px-4 py-2">N/A</td>
                                    <td className="px-4 py-2">N/A</td>
                                    <td className="px-4 py-2">N/A</td>
                                    <td className="px-4 py-2">{swap.pair.reserveUSD}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;