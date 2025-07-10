import Image from 'next/image';

export default function Header() {
  return (
    <div className="flex flex-col items-center py-6">
      <Image src="/Image/HFClogo.png" alt="HerFoodCode Logo" width={120} height={120} className="mx-auto" />
      <p className="text-md text-olive-700 font-medium mb-6 text-center">Decode which foods work for you.</p>
    </div>
  );
} 