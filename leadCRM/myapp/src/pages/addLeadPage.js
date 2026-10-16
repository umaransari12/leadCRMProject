import React from 'react'
import { useNavigate } from 'react-router-dom'
import AddLeadSec from '../components/addLeadSec/addLeadSec'

const AddLeadPage = () => {
  const navigate = useNavigate();
  const goToLeads = () => navigate('/lead');

  return (
    <>
    <AddLeadSec onClose={goToLeads} />
    </>
  )
}

export default AddLeadPage
