import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-[#1a1c29] flex flex-col text-gray-300 py-12 px-6 lg:px-16 gap-8 border-t border-gray-700">
            <div className="lg:col-span-1 flex justify-start lg:justify-center mb-6 lg:mb-0">
                <span className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-500 bg-clip-text text-transparent">
                    HyperX
                </span>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-64">
                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">Solutions</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Marketing</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Analytics</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Automation</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Commerce</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Insights</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Submit ticket</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Documentation</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Guides</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">About</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Blog</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Jobs</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Press</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Terms of service</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Privacy policy</a></li>
                        <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">License</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    )
}

export default Footer
