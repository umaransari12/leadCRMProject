import React from 'react'
import "./leadLayoutSec.scss"
import Sidebar from '../sidebar/sidebar'
import LeadSec from '../leadSec/leadSec'

const LeadLayoutSec = () => {
  return (
     <div className="leadlayout_sec">
        <div className="container_fluid">
            <div className="leadlayout_inr">
                <div className="row">
                    <div className="col_sidebar_otr">
                        <div className="col_sidebar_inr">
                            <Sidebar/>
                        </div>
                    </div>
                    <div className="col_lead_otr">
                        <div className="col_lead_inr">
                            <LeadSec/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
     </div>
  )
}

export default LeadLayoutSec