
import Header from '../../layouts/Header'
import DashboadBody_1 from './DashboardBody_1'
import DashboardBody_2 from './DashboardBody_2'
import DashboardBody_3 from './DashboardBody_3'
import DashboardBody_4 from './DashboardBody_4'
import Footer from '../../layouts/Footer'
import ScrollToTopButton from './ScrollToTopButton'



export default function Home() {


    return (
        <div className="bg-gray-900">
            <DashboadBody_1 />
            <DashboardBody_2 />
            <DashboardBody_3 />
            <DashboardBody_4 />
            <ScrollToTopButton />
        </div>
    )
}
