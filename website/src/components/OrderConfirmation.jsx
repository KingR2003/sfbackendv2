import React from "react";
import { Check, ArrowRight } from "lucide-react";

const OrderConfirmation = ({
    onContinueShopping = () => { },
    onReturnHome = () => { },
    orderId = "#SV-431423",
}) => {
    return (
        <section className="bg-[#FEF8F0] min-h-[calc(100vh-120px)] px-4 py-16 flex items-center justify-center font-['Poppins',sans-serif]">
            <div className="relative w-full max-w-md bg-[#FFFFFF] rounded-[32px] px-8 py-10 text-center shadow-[0_25px_60px_rgba(124,50,37,0.08)] border border-[#EBEBEB] mt-8">

                {/* Success Icon overlap */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1AA60B] shadow-[0_12px_24px_rgba(26,166,11,0.3)] border-4 border-[#FFFFFF]">
                        <Check size={40} className="text-white" strokeWidth={3} />
                    </div>
                </div>

                <div className="mt-8">
                    <h1 className="text-3xl font-semibold text-[#7C3225] font-['Poppins',sans-serif] mb-3">
                        Order Placed!
                    </h1>
                    <p className="text-sm text-[#7C3225] leading-relaxed px-4">
                        Thank you for your purchase. We've sent a confirmation email to you.
                    </p>
                </div>

                <div className="mt-8 mb-10 rounded-2xl bg-[#FEF8F0] py-5 px-6">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-[#868889] uppercase mb-1">
                        Order Number
                    </p>
                    <p className="text-lg font-bold text-[#7C3225] tracking-wide">
                        {orderId}
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={onContinueShopping}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3225] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-[0_15px_30px_rgba(124,50,37,0.2)] transition-transform hover:-translate-y-0.5"
                    >
                        Continue Shopping <ArrowRight size={18} />
                    </button>

                    <button
                        onClick={onReturnHome}
                        className="text-xs font-semibold tracking-[0.1em] text-[#7C3225] uppercase hover:opacity-70 transition-opacity mt-2"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </section>
    );
};

export default OrderConfirmation;
