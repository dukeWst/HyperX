import React from 'react'
import IMGgame from '../../assets/OIP.webp'
import IMGapp from '../../assets/mexicanas-580x385.jpg'
import IMGfinance from '../../assets/banking-symbol-financial-system-icon-circulation-vector-2500843-15654281304022058063886-crop-15654281627291067117848-crop-1565428177047472866763.jpg'
import IMGconnect from '../../assets/OIP (1).webp'


const DashboardBody_2 = () => {
    return (
        <div>
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            >
                <div
                    style={{
                        clipPath:
                            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                    className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
                />
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    <div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
                            We're changing the way people connect
                        </h1>
                        <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
                            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat. Anim aute id magna aliqua ad ad non deserunt sunt.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="space-y-4">
                            <div className="flex items-end justify-end space-x-4">
                                <div className="relative w-2/3 h-60 rounded-xl overflow-hidden shadow-2xl">
                                    <img
                                        className="absolute inset-0 h-full w-full object-cover"
                                        src={IMGgame}
                                        alt="Presentation on whiteboard"
                                    />
                                </div>
                                <div className="relative w-1/3 h-60 rounded-xl overflow-hidden shadow-2xl">
                                    <img
                                        className="absolute inset-0 h-full w-full object-cover"
                                        src={IMGapp}
                                        alt="Man smiling"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <div className="relative w-1/2 h-60 rounded-xl overflow-hidden shadow-2xl">
                                    <img
                                        className="absolute inset-0 h-full w-full object-cover"
                                        src={IMGconnect}
                                        alt="Woman working on laptop"
                                    />
                                </div>
                                <div className="relative w-1/2 h-60 rounded-xl overflow-hidden shadow-2xl">
                                    <img
                                        className="absolute inset-0 h-full w-full object-cover"
                                        src={IMGfinance}
                                        alt="People collaborating in office"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-[#111327] to-transparent pointer-events-none" aria-hidden="true"></div>
                    </div>

                </div>

            </div>
        </div>
    )
}

export default DashboardBody_2
