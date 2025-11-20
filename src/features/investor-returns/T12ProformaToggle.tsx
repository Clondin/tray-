import React from 'react';
import { useAppStore } from '../../store/appStore';

export const T12ProformaToggle: React.FC = () => {
    const { returnsViewMode, setReturnsViewMode } = useAppStore(state => ({
        returnsViewMode: state.returnsViewMode,
        setReturnsViewMode: state.setReturnsViewMode
    }));

    const isProforma = returnsViewMode === 'proforma';

    const handleChange = () => {
        setReturnsViewMode(isProforma ? 't12' : 'proforma');
    };

    return (
        <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                id="returns-mode-checkbox" 
                className="hidden peer"
                checked={isProforma}
                onChange={handleChange}
            />
            <label 
                htmlFor="returns-mode-checkbox" 
                className="
                    relative flex items-center justify-around cursor-pointer
                    h-10 w-[140px] rounded-full 
                    bg-[#e0e5ec] 
                    shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.06),_inset_0_0_10px_1px_rgba(0,0,0,0.2),_3px_5px_10px_rgba(0,0,0,0.09)]
                    transition-transform duration-400
                    hover:[transform:perspective(100px)_rotateX(5deg)_rotateY(-5deg)]
                    peer-checked:hover:[transform:perspective(100px)_rotateX(-5deg)_rotateY(5deg)]
                "
            >
                {/* The sliding thumb */}
                <span 
                    className="
                        absolute left-1 top-1 h-8 w-[65px] rounded-full 
                        bg-accent-primary 
                        shadow-[0_2px_1px_rgba(0,0,0,0.1),_3px_3px_3px_rgba(0,0,0,0.1)]
                        transition-transform duration-400 ease-[cubic-bezier(0.785,0.135,0.15,0.86)]
                        peer-checked:translate-x-[67px]
                    "
                    aria-hidden="true"
                ></span>
                
                {/* Text labels */}
                <span className="z-10 w-1/2 text-center text-small font-semibold transition-colors duration-400 ease-in-out text-text-on-accent peer-checked:text-text-secondary">
                    T12
                </span>
                <span className="z-10 w-1/2 text-center text-small font-semibold transition-colors duration-400 ease-in-out text-text-secondary peer-checked:text-text-on-accent">
                    Pro Forma
                </span>
            </label>
        </div>
    );
};
