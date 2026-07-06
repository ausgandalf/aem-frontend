import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

interface LogoProps {
    width?: number;
    height?: number;
}

export default function Logo({ width = 80, height = 50 }: LogoProps) {
    const { resolvedTheme } = useTheme();
    const logo_file = resolvedTheme == 'dark' ? '/images/logo.png' : '/images/logo-colored.png';
    return (
        <Image
        key={logo_file}
        src={logo_file}
        alt="WRBLO"
        width={width}
        height={height}
        />
    );
}