import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { customerCreditService } from '../services/customerCreditService';

export default function CustomerCreditManagement() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditDetails, setCreditDetails] = useState(null);
  const [agingData, setAgingData] = useState(null);
  const [highRiskCustomers, setHighRiskCustomers] = useState([]);
  const [overLimitCustomers, setOverLimitCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    loadCreditData();
  }, []);

  const loadCreditData = async () => {
    try {
      setLoading(true);

      
      const [highRisk, overLimit] = await Promise.all([
        customerCreditService.getHighRiskCustomers(50),
        customerCreditService.getOverLimitCustomers(),
      ]);




      // Handle both null and array responses
      const highRiskData = highRisk?.customers || [];
      const overLimitData = overLimit?.customers || [];
      



      setHighRiskCustomers(highRiskData);
      setOverLimitCustomers(overLimitData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load credit data';
      setError(errorMsg);
      console.error('[CustomerCreditManagement] Error loading credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer) => {
    try {
      setSelectedCustomer(customer);

      
      const [details, aging] = await Promise.all([
        customerCreditService.getCustomerCreditSummary(customer.id),
        customerCreditService.getCustomerAging(customer.id),
      ]);




      setCreditDetails(details);
      setAgingData(aging);
      setNewCreditLimit((details?.creditLimit || details?.credit_limit || 0).toString());
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load customer details';
      setError(`Error loading customer details: ${errorMsg}`);
      console.error('[CustomerCreditManagement] Error loading customer details:', err);
    }
  };

  const handleUpdateCreditLimit = async () => {
    if (!newCreditLimit || !selectedCustomer) return;

    try {
      setUpdating(true);
      await customerCreditService.updateCreditLimit(
        selectedCustomer.id,
        parseFloat(newCreditLimit),
        adjustmentReason || 'Manual adjustment',
      );

      setError(null);
      // Reload data
      setTimeout(() => {
        handleSelectCustomer(selectedCustomer);
        setAdjustmentReason('');
      }, 1000);
    } catch (err) {
      setError(`Error updating credit limit: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getCreditGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'E':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">Loading credit data...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Customer Credit Management</h1>
        <p className="text-gray-600 mb-6">Monitor credit utilization, DSO, and customer credit grades</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Risk Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">High Risk Customers</div>
            <div className="text-3xl font-bold text-red-600">{highRiskCustomers.length}</div>
            <p className="text-xs text-gray-500 mt-1">(D/E grades)</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Over Limit</div>
            <div className="text-3xl font-bold text-orange-600">{overLimitCustomers.length}</div>
            <p className="text-xs text-gray-500 mt-1">Credit exceeded</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Avg DSO</div>
            <div className="text-3xl font-bold text-blue-600">45</div>
            <p className="text-xs text-gray-500 mt-1">Days Sales Outstanding</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Credit Quality</div>
            <div className="text-lg font-bold text-green-600">Stable</div>
            <p className="text-xs text-gray-500 mt-1">Portfolio trend</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* High Risk & Over Limit List */}
          <div className="lg:col-span-2">
            {/* High Risk Customers */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  High Risk Customers
                </h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {highRiskCustomers.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">No high-risk customers</div>
                ) : (
                  highRiskCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{customer.customerName}</p>
                          <p className="text-sm text-gray-600">{customer.customerCode}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCreditGradeColor(customer.creditGrade)}`}>
                          Grade {customer.creditGrade}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">DSO:</span> {customer.dsoValue} days
                        </div>
                        <div>
                          <span className="text-gray-600">Utilization:</span> {customer.creditUtilization}%
                        </div>
                        <div>
                          <span className="text-gray-600">Limit:</span> ${customer.creditLimit?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Over Limit Customers */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Over Credit Limit
                </h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {overLimitCustomers.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">No customers over limit</div>
                ) : (
                  overLimitCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition border-l-4 border-red-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{customer.customerName}</p>
                          <p className="text-sm text-gray-600">{customer.customerCode}</p>
                        </div>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                          OVER LIMIT
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Outstanding:</span> ${customer.outstandingAmount?.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-600">Limit:</span> ${customer.creditLimit?.toFixed(2)}
                        </div>
                        <div className="text-red-600 font-semibold">
                          +${(customer.outstandingAmount - customer.creditLimit)?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Customer Detail Panel */}
          <div className="lg:col-span-1">
            {selectedCustomer && creditDetails ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-4">{selectedCustomer.customerName}</h2>

                {/* Credit Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Credit Grade</span>
                    <span className={`px-3 py-1 rounded font-bold ${getCreditGradeColor(creditDetails.creditGrade)}`}>
                      {creditDetails.creditGrade}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Credit Limit</span>
                    <span className="font-semibold">${creditDetails.creditLimit?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Outstanding</span>
                    <span className="font-semibold">${creditDetails.outstandingAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Credit</span>
                    <span className={`font-semibold ${(creditDetails.creditLimit - creditDetails.outstandingAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.max(0, creditDetails.creditLimit - creditDetails.outstandingAmount)?.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-gray-600">DSO</span>
                    <span className="font-semibold">{creditDetails.dsoValue} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-semibold">{creditDetails.creditUtilization}%</span>
                  </div>
                </div>

                {/* Aging Summary */}
                {agingData && (
                  <div className="border-t pt-4 mb-6">
                    <h3 className="font-semibold mb-2">Aging</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current</span>
                        <span className="font-semibold">${agingData.currentAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1-30 days</span>
                        <span className="font-semibold">${agingData.days1_30?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>31-60 days</span>
                        <span className="font-semibold">${agingData.days31_60?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>61-90 days</span>
                        <span className="font-semibold">${agingData.days61_90?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>90+ days</span>
                        <span className="font-semibold text-red-600">${agingData.days90Plus?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Update Credit Limit */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Update Credit Limit</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">New Credit Limit</label>
                      <input
                        type="number"
                        value={newCreditLimit}
                        onChange={(e) => setNewCreditLimit(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter new limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
                      <textarea
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        rows="3"
                        placeholder="Reason for adjustment"
                      />
                    </div>
                    <button
                      onClick={handleUpdateCreditLimit}
                      disabled={updating || !newCreditLimit}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {updating ? 'Updating...' : 'Update Limit'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <p>Select a customer to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
