'use client';

import { useIncomingCalls } from '@/hooks/useIncomingCalls';
import IncomingCallModal from '@/components/IncomingCallModal';

export default function CallProvider({ children }: { children: React.ReactNode }) {
  const { incomingCall, answerCall, declineCall } = useIncomingCalls();

  return (
    <>
      {children}
      <IncomingCallModal 
        call={incomingCall} 
        onAnswer={answerCall} 
        onDecline={declineCall} 
      />
    </>
  );
}
