import { useRouter } from 'next/router';
import Link from 'next/link';

const Navbar = () => {
    const router = useRouter();

    return (
        <nav className="bg-gray-800 p-4">
            <ul className="flex space-x-4">
                <li>
                    <Link href="/dashboard" legacyBehavior>
                        <a className={`text-white hover:text-gray-400 ${router.pathname === '/dashboard' ? 'font-bold' : ''}`}>All</a>
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/uniswap" legacyBehavior>
                        <a className={`text-white hover:text-gray-400 ${router.pathname === '/dashboard/uniswap' ? 'font-bold' : ''}`}>Uniswap</a>
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard/pancakeswap" legacyBehavior>
                        <a className={`text-white hover:text-gray-400 ${router.pathname === '/dashboard/pancakeswap' ? 'font-bold' : ''}`}>Pancakeswap</a>
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;