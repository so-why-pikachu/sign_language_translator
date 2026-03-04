import React, { createContext, useContext, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// --- 类型定义 ---
interface TransitionContextType {
    timeline: gsap.core.Timeline | null;
    navigateWithTransition: (to: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({
    timeline: null,
    navigateWithTransition: () => {},
});

// --- 样式 (建议放入单独的 CSS 文件，这里为了方便展示写在一起) ---
const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none' as const, // 避免遮挡点击，但在动画过程中我们需要它阻挡交互
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    eyelid: {
        width: '100%',
        height: '0%', // 初始高度为0
        backgroundColor: '#1a1a1a', // 眼皮颜色，可以是黑色或品牌色
    },
};

export const BlinkTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const topEyelidRef = useRef<HTMLDivElement>(null);
    const bottomEyelidRef = useRef<HTMLDivElement>(null);

    // 这里的 state 用于确保 GSAP timeline 初始化后再暴露 context
    const [tl, setTl] = useState<gsap.core.Timeline | null>(null);

    // 使用 useGSAP 进行安全的动画管理
    useGSAP(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({ paused: true });

            // 1. 闭眼动画
            timeline
                .to([topEyelidRef.current, bottomEyelidRef.current], {
                    height: '50%',
                    duration: 0.4,
                    ease: 'power4.inOut',
                })
                // 2. 切换路由的“钩子”位置 (我们会在代码里手动调用 navigate)
                .addLabel('switch')
                // 3. 睁眼动画
                .to([topEyelidRef.current, bottomEyelidRef.current], {
                    height: '0%',
                    duration: 0.4,
                    ease: 'power4.inOut',
                    delay: 0.1, // 稍微停顿一下，更有质感
                });

            setTl(timeline);
        }, containerRef);

        return () => ctx.revert();
    }, { scope: containerRef }); // scope 此时没那么重要，因为我们用了 refs，但好习惯要有

    // --- 核心逻辑：带转场的导航 ---
    const navigateWithTransition = (to: string) => {
        // 如果点击的是当前路径，不做反应
        if (location.pathname === to) return;

        if (tl) {
            // 启用遮罩交互，防止动画过程中用户乱点
            if (containerRef.current) containerRef.current.style.pointerEvents = 'all';

            // 播放进场动画 -> 切换路由 -> 播放出场动画
            tl.restart(); // 从头开始

            // 当动画到达中间（闭眼完成）时，执行路由切换
            tl.call(() => {
                navigate(to);
                // 可以在这里加个 window.scrollTo(0, 0) 确保新页面在顶部
                window.scrollTo(0, 0);
            }, undefined, 0.4); // 0.4 是上面闭眼动画的 duration

            // 动画结束后，恢复穿透
            tl.eventCallback('onComplete', () => {
                if (containerRef.current) containerRef.current.style.pointerEvents = 'none';
            });
        } else {
            // 降级处理：如果没有动画，直接跳转
            navigate(to);
        }
    };

    return (
        <TransitionContext.Provider value={{ timeline: tl, navigateWithTransition }}>
            {/* 这里的 children 是你的页面内容 */}
            {children}

            {/* 这里的 div 是遮罩层 */}
            <div ref={containerRef} style={styles.overlay}>
                <div ref={topEyelidRef} style={styles.eyelid} className="eyelid-top" />
                <div ref={bottomEyelidRef} style={styles.eyelid} className="eyelid-bottom" />
            </div>
        </TransitionContext.Provider>
    );
};

// --- Custom Hook ---
export const useBlinkNavigate = () => {
    const context = useContext(TransitionContext);
    return context.navigateWithTransition;
};

// --- 封装一个类似 Link 的组件方便使用 ---
interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    children: React.ReactNode;
}

export const BlinkLink: React.FC<TransitionLinkProps> = ({ to, children, className, style }) => {
    const blinkNavigate = useBlinkNavigate();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault(); // 阻止默认的立即跳转
        blinkNavigate(to);
    };

    return (
        <a href={to} onClick={handleClick} className={className} style={{ cursor: 'pointer', ...style }}>
            {children}
        </a>
    );
};