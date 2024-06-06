import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { ethers } from 'ethers';

const Navbar = () => {
    const { data: session } = useSession();
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        const checkWalletConnection = async () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        setAccount(accounts[0].address);
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                }
            }
        };
        checkWalletConnection();
    }, []);

    return (
        <nav className="bg-gray-800 p-4 flex justify-between items-center">
            <ul className="flex space-x-4">
                <li>
                    <Link href="/dashboard" legacyBehavior>
                        <a className="text-white hover:text-gray-400">All</a>
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/uniswap" legacyBehavior>
                        <a className="text-white hover:text-gray-400">Uniswap</a>
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/pancakeswap" legacyBehavior>
                        <a className="text-white hover:text-gray-400">Pancakeswap</a>
                    </Link>
                </li>
            </ul>
            {session && (
                <div className="flex items-center space-x-4">
                    <div className="text-white">
                        {account ? (
                            <span className="block text-sm">{account}</span>
                        ) : (
                            <span className="block text-sm">No Wallet Connected</span>
                        )}
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;