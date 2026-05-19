import React from 'react'
import "./dashboardLayoutSec.scss"
import Sidebar from '../sidebar/sidebar'
import DashboardSec from '../dashboardSec/dashboardSec'

const DashboardLayoutSec = () => {
  return (
    <div className="dashboardlayout_sec">
        <div className="container_fluid">
            <div className="dashboardlayout_inr">
                <div className="row">
                    <div className="col_sidebar_otr">
                        <div className="col_sidebar_inr">
                            <Sidebar/>
                        </div>
                    </div>
                    <div className="col_dashboard_otr">
                        <div className="col_dashboard_inr">
                            <DashboardSec/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default DashboardLayoutSec