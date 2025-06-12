"use client";
import React, { useEffect, useState } from "react";
import PhaseAdviceTable from "../../components/PhaseAdviceTable";
import { AdviceResponse } from "../../types";
import { useRouter } from "next/navigation";

export default function AdvicePage() {
    const [advice, setAdvice] = useState<AdviceResponse | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("advice");
            if (stored) {
                setAdvice(JSON.parse(stored));
            } else {
                router.replace("/intake");
            }
        }
    }, [router]);

    if (!advice) {
        return <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">Loading advice...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-6">Your Personalized PCOS Nutrition Advice</h1>
            <PhaseAdviceTable advice={advice} />
        </div>
    );
} 