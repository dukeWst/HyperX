import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const NeedAuthModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleSignIn = () => {
        onClose();
        navigate('/signin');
    };

    const handleSignUp = () => {
        onClose();
        navigate('/signup');
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[20000]" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-[#020205]/90 backdrop-blur-md" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-8"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-8"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-[#0B0D14] border border-white/5 p-8 text-left align-middle shadow-[0_0_50px_rgba(6,182,212,0.15)] transition-all">
                                
                                {/* Decor */}
                                <div className="absolute top-0 right-0 -z-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 -z-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

                                <div className="flex flex-col items-center text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
                                        <LockClosedIcon className="h-8 w-8 text-cyan-500" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">
                                        Authentication Required
                                    </h3>
                                    
                                    <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 px-4">
                                        This area of the <span className="text-cyan-400 font-bold">HyperX</span> ecosystem is reserved for members. Please sign in to access our premium services.
                                    </p>

                                    <div className="grid grid-cols-1 w-full gap-4">
                                        <button
                                            onClick={handleSignIn}
                                            className="w-full py-4 bg-white text-black text-sm font-black rounded-2xl hover:bg-cyan-50 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl shadow-white/5 uppercase tracking-widest"
                                        >
                                            Sign In Now
                                        </button>
                                        
                                        <button
                                            onClick={handleSignUp}
                                            className="w-full py-4 bg-white/5 border border-white/10 text-white text-sm font-black rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 uppercase tracking-widest"
                                        >
                                            Create Account
                                        </button>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="mt-6 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Close and Return
                                    </button>
                                </div>

                                {/* Status bar placeholder */}
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-3 opacity-20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                                    <span className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-widest">Secure Link Waiting</span>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default NeedAuthModal;
