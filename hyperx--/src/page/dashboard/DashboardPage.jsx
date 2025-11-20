
import Header from '../../layouts/Header'
import DashboadBody_1 from './DashboardBody_1'
import { useState } from 'react'
import DashboardBody_2 from './DashboardBody_2'
import DashboardBody_3 from './DashboardBody_3'
import DashboardBody_4 from './DashboardBody_4'
import Footer from '../../layouts/Footer'



export default function Example() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="bg-gray-900">
            <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            <DashboadBody_1 />
            <DashboardBody_2 />
            <DashboardBody_3 />
            <DashboardBody_4 />
            <Footer />
        </div>
    )
}
