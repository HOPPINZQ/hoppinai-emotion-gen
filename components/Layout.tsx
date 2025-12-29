
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-xl">
      <header className="p-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full healing-gradient flex items-center justify-center text-white font-bold text-lg">
            镜
          </div>
          <h1 className="text-xl font-bold text-slate-700">心语镜</h1>
        </div>
        <div className="text-xs text-slate-400">吐槽治愈所</div>
      </header>
      <main className="flex-1 p-6 relative">
        {children}
      </main>
      <footer className="p-4 text-center text-[10px] text-slate-400">
        所有测评结果仅供参考，不作为医疗诊断建议
      </footer>
    </div>
  );
};
