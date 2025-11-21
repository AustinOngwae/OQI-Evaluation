import React, { useState } from 'react';

const UserInfoForm = ({ onSubmit }) => {
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    organization: '',
    qualifications: '',
    location: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(userInfo);
  };

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 md:p-6">
      <div className="glass-card p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-2 font-sans">Before you begin...</h2>
        <p className="text-gray-300 mb-6 font-body">Please provide some information about yourself. This helps us understand the context of your evaluation.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
              <input type="text" id="firstName" name="firstName" value={userInfo.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
              <input type="text" id="lastName" name="lastName" value={userInfo.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-1">Job / Career Title</label>
              <input type="text" id="jobTitle" name="jobTitle" value={userInfo.jobTitle} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-1">Organization</label>
              <input type="text" id="organization" name="organization" value={userInfo.organization} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label htmlFor="qualifications" className="block text-sm font-medium text-gray-300 mb-1">Qualifications</label>
            <textarea id="qualifications" name="qualifications" value={userInfo.qualifications} onChange={handleChange} rows="2" placeholder="e.g., PhD in Quantum Physics, 10 years in tech policy..."></textarea>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input type="text" id="location" name="location" value={userInfo.location} onChange={handleChange} placeholder="e.g., Geneva, Switzerland" />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full btn-primary py-3">
              Proceed to Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserInfoForm;