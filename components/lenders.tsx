import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import escrowABI from '../contracts/Escrow.sol/Escrow.json';
import lenderABI from '../contracts/Lender.sol/Lender.json';
import axios from 'axios';

interface Deal {
    type: string;
    amount: number;
    interestGained: number;
    dateTime: string;
}

const Lenders = () => {
    const { data: session } = useSession();
    const [depositAmount, setDepositAmount] = useState('');
    const [currentDeposit, setCurrentDeposit] = useState(0);
    const [interestEarned, setInterestEarned] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const [allDeals, setAllDeals] = useState<Deal[]>([]);
    const [showAllDeals, setShowAllDeals] = useState(false);
    const [newInterestRate, setNewInterestRate] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS ? process.env.NEXT_PUBLIC_ADMIN_ADDRESS : "0x0";
    const escrowabi = escrowABI["abi"];
    const lenderabi = lenderABI["abi"];
    const escrowContractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ? process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS : "0x0";
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();

    useEffect(() => {
        if (session) {
            checkAdmin();
            fetchDepositInfo();
            fetchAllDeals(Number(session.user.id));
            const interval = setInterval(fetchDepositInfo, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval); // Cleanup on component unmount
        }
    }, [session]);

    const checkAdmin = async () => {
        const accounts = await provider.listAccounts();
        if (accounts[0].address.toLowerCase() === adminAddress.toLowerCase()) {
            setIsAdmin(true);
        }
    };

    const fetchDepositInfo = async () => {
        if (typeof window.ethereum !== 'undefined') {
            const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);

            try {
                const lenderContractAddress = await escrowContract.lenderContract();
                const lenderContract = new ethers.Contract(lenderContractAddress, lenderabi, await signer);

                const lenderInfo = await lenderContract.lenders((await signer).getAddress());
                const interest = await lenderContract.totalInterestGained((await signer).getAddress());
                const rate = await lenderContract.interestRate();

                setCurrentDeposit(parseFloat(ethers.formatUnits(lenderInfo.amount, 'wei')));
                setInterestEarned(parseFloat(ethers.formatUnits(interest, 'wei')));
                setInterestRate(parseFloat(ethers.formatUnits(rate, 'wei')));
            } catch (error) {
                console.error('Error fetching deposit info:', error);
            }
        }
    };

    const fetchAllDeals = async (userId: number) => {
        try {
            const response = await axios.get('/api/deals-lenders', {
                params: { userId }
            });
            setAllDeals(response.data.reverse()); // Reverse the order of the deals
        } catch (error) {
            console.error('Error fetching all deals:', error);
        }
    };

    const handleDeposit = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.deposit({ value: ethers.parseUnits(depositAmount, 'wei') });
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Deposit transaction successful');
                    await fetchDepositInfo();
                    await saveDeal('deposit', parseFloat(depositAmount), 0, Number(session?.user.id)); // No interest for deposit
                } else {
                    alert('Deposit transaction failed');
                }
            } catch (error: any) {
                alert(`Error during deposit: ${error.message}`);
                console.error('Error during deposit:', error);
            }
        }
    };

    const handleWithdraw = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.withdraw();
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    alert('Withdraw transaction successful');
                    await fetchDepositInfo();
                    const totalAmount = currentDeposit + interestEarned;
                    await saveDeal('withdraw', totalAmount, interestEarned, Number(session?.user.id));
                } else {
                    alert('Withdraw transaction failed');
                }
            } catch (error: any) {
                alert(`Error during withdraw: ${error.message}`);
                console.error('Error during withdraw:', error);
            }
        }
    };

    const saveDeal = async (type: string, amount: number, interestGained: number, userId: number) => {
        try {
            await axios.post('/api/deals-lenders', {
                type,
                amount,
                interestGained,
                dateTime: new Date().toISOString(),
                userId,
            });
            await fetchAllDeals(userId);
        } catch (error) {
            console.error('Error saving deal:', error);
        }
    };

    const handleChangeInterestRate = async () => {
        if (typeof window.ethereum !== 'undefined' && newInterestRate) {
            try {
                const escrowContract = new ethers.Contract(escrowContractAddress, escrowabi, await signer);
                const tx = await escrowContract.changeLendersInterestRate(ethers.parseUnits(newInterestRate, 'wei'));
                await tx.wait();
                await fetchDepositInfo();
                setNewInterestRate('');
                alert('Interest rate changed successfully');
            } catch (error) {
                console.error('Error changing interest rate:', error);
                alert('Failed to change interest rate');
            }
        }
    };

    if (!session) {
        return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h2 className="text-2xl font-bold mb-4">Lender Section</h2>
            <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl flex">
                <div className="w-1/2 p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Current Deposit</h3>
                        <p>{currentDeposit} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Interest Earned</h3>
                        <p>{interestEarned} Wei</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Interest Rate</h3>
                        <p>{interestRate / 100} %</p>
                    </div>
                    {isAdmin && (
                        <div className="mb-4">
                            <input
                                type="number"
                                value={newInterestRate}
                                onChange={(e) => setNewInterestRate(e.target.value)}
                                placeholder="New Interest Rate multiplied by 100"
                                className="w-full p-2 border rounded"
                            />
                            <button onClick={handleChangeInterestRate} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                                Change Interest Rate
                            </button>
                        </div>
                    )}
                </div>
                <div className="w-1/2 p-4">
                    <div className="mb-4">
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Deposit Amount in Wei"
                            className="w-full p-2 border rounded"
                        />
                        <button onClick={handleDeposit} className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Deposit
                        </button>
                    </div>
                    <div className="mb-4">
                        <button onClick={handleWithdraw} className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded shadow-md w-full max-w-4xl mt-6">
                <button
                    onClick={() => setShowAllDeals(!showAllDeals)}
                    className="mb-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    {showAllDeals ? 'Collapse All Deals' : 'Show All Deals'}
                </button>
                {showAllDeals && (
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2">Type</th>
                                <th className="py-2">Amount (Wei)</th>
                                <th className="py-2">Interest Gained (Wei)</th>
                                <th className="py-2">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allDeals.map((deal, index) => (
                                <tr key={index} className="text-center">
                                    <td className="py-2">{deal.type}</td>
                                    <td className="py-2">{deal.amount}</td>
                                    <td className="py-2">{deal.interestGained}</td>
                                    <td className="py-2">{new Date(deal.dateTime).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Lenders;
