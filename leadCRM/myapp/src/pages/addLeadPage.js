import React from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/appShell/appShell'
import AddLeadSec from '../components/addLeadSec/addLeadSec'

const AddLeadPage = () => {
  const navigate = useNavigate();

  return (
    <AppShell title="Add Lead">
      <AddLeadSec variant="page" onClose={() => navigate('/lead')} />
    </AppShell>
  )
}

export default AddLeadPage
