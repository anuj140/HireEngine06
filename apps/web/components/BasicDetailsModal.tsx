
import React, { useState, useEffect } from 'react';
import { User, UserProfile } from '../../../packages/types';
import { CloseIcon, CheckCircleIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface BasicDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updates: Partial<User>) => Promise<void>;
}

const noticePeriods: UserProfile['noticePeriod'][] = ['15 Days or less', '1 Month', '2 Months', '3 Months', 'More than 3 Months', 'Serving Notice Period'];

const indianStatesAndDistricts: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR District, Kadapa (Cuddapah)"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao (North Cachar Hills)", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada (South Bastar)", "Dhamtari", "Durg", "Gariyaband", "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)", "Kanker (North Bastar)", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha (Palanpur)", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang (Ahwa)", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda (Nadiad)", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada (Rajpipla)", "Navsari", "Panchmahal (Godhra)", "Patan", "Porbandar", "Rajkot", "Sabarkantha (Himmatnagar)", "Surat", "Surendranagar", "Tapi (Vyara)", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram (Gurgaon)", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul &amp; Spiti", "Mandi", "Shimla", "Sirmaur (Sirmour)", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum (Jamshedpur)", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribag", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela-Kharsawan", "Simdega", "West Singhbhum (Chaibasa)"],
  "Karnataka": ["Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Rural", "Bengaluru (Bangalore) Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru (Chikmagalur)", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara", "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Udupi", "Uttara Kannada (Karwar)", "Vijayapura (Bijapur)", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Sambhajinagar", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr (Shahid Bhagat Singh Nagar)", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi (Tuticorin)", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhoopalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal (Rural)", "Warangal (Urban)", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi (Chatrapati Sahuji Mahraj Nagar)", "Amroha (J.P. Nagar)", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur (Panchsheel Nagar)", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal (Bhim Nagar)", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur (South Dinajpur)", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Medinipur (West Medinipur)", "Paschim (West) Burdwan (Bardhaman)", "Purba Burdwan (Bardhaman)", "Purba Medinipur (East Medinipur)", "Purulia", "South 24 Parganas", "Uttar Dinajpur (North Dinajpur)"],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Anantnag", "Bandipore", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

const inputClasses = "w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-dark-gray placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200";
const labelClasses = "block text-sm font-bold text-dark-gray mb-2";

const BasicDetailsModal: React.FC<BasicDetailsModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    email: user.email,
    isPhoneVerified: user.isPhoneVerified || false,
    isEmailVerified: user.isEmailVerified || true,
    noticePeriod: user.profile?.noticePeriod || '15 Days or less',
    workStatus: user.profile?.workStatus || 'Fresher',
    totalExperience: {
      years: user.profile?.totalExperience?.years || '0',
      months: user.profile?.totalExperience?.months || '0',
    },
    currentSalary: {
      currency: user.profile?.currentSalary?.currency || '₹',
      amount: user.profile?.currentSalary?.amount || '',
      breakdown: user.profile?.currentSalary?.breakdown || 'Fixed',
    },
    currentLocation: {
      inIndia: user.profile?.currentLocation?.inIndia ?? true,
      city: user.profile?.currentLocation?.city || '',
      area: user.profile?.currentLocation?.area || '',
    },
    gender: user.profile?.gender || 'Male',
    maritalStatus: user.profile?.maritalStatus || 'Single',
    dateOfBirth: user.profile?.dateOfBirth ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0] : '',
    address: user.profile?.address || '',
  });

  const [verifyView, setVerifyView] = useState<'none' | 'phone' | 'email'>('none');
  const [otp, setOtp] = useState('');
  const [tempValue, setTempValue] = useState('');

  const employment = user.profile?.employment || [];
  const hasEmployment = employment.length > 0;
  // Get current employment or the most recent one
  const latestEmployment = employment.find(emp => emp.isCurrent) || employment[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as 'Fresher' | 'Experienced';
    if (val === 'Fresher' && hasEmployment) {
      addToast("Please remove your employment details to mark yourself as a Fresher.", "info");
      return;
    }
    setFormData(prev => ({ ...prev, workStatus: val }));
  };

  const handleNestedChange = (parent: string, child: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        // @ts-ignore
        ...prev[parent],
        [child]: value,
      }
    }));
  };

  const handleInitiateVerify = (type: 'phone' | 'email') => {
    setVerifyView(type);
    setTempValue(type === 'phone' ? formData.phone : formData.email);
  };

  const handleVerify = () => {
    if (otp === '123456') {
      if (verifyView === 'phone') {
        setFormData(prev => ({ ...prev, phone: tempValue, isPhoneVerified: true }));
      } else if (verifyView === 'email') {
        setFormData(prev => ({ ...prev, email: tempValue, isEmailVerified: true }));
      }
      setVerifyView('none');
      setOtp('');
      setTempValue('');
    } else {
      alert('Invalid OTP. Please use 123456 for this demo.');
    }
  };

  const handleCancelVerify = () => {
    setVerifyView('none');
    setOtp('');
    setTempValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { name, phone, email, isPhoneVerified, isEmailVerified, ...profileData } = formData;

    if (profileData.workStatus === 'Fresher') {
      profileData.totalExperience = { years: '0', months: '0' };
      profileData.currentSalary = { currency: '₹', amount: '', breakdown: 'Fixed' };
    }

    const updates: Partial<User> = {
      name,
      phone,
      email,
      isPhoneVerified,
      isEmailVerified,
      profile: {
        ...user.profile,
        ...profileData,
      },
    };

    try {
      await onSave(updates);
    } catch (error) {
      // Parent component will show toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const VerificationView = () => (
    <div className="p-6 space-y-4">
      <h3 className="font-bold text-lg">Verify your new {verifyView}</h3>
      <div>
        <label className={labelClasses}>New {verifyView === 'phone' ? 'Mobile Number' : 'Email Address'}</label>
        <input type={verifyView === 'phone' ? 'tel' : 'email'} value={tempValue} onChange={e => setTempValue(e.target.value)} className={inputClasses} autoFocus />
      </div>
      <div>
        <label className={labelClasses}>Enter OTP</label>
        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Dummy OTP is 123456" className={inputClasses} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={handleCancelVerify} className="px-6 py-2.5 rounded-full font-bold text-dark-gray hover:bg-gray-100 transition-colors">Cancel</button>
        <button type="button" onClick={handleVerify} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-md">Verify & Save</button>
      </div>
    </div>
  );


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="px-8 py-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-dark-gray">Basic details</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
        </header>

        {verifyView !== 'none' ? <VerificationView /> : (
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Name */}
              <div>
                <label htmlFor="name" className={labelClasses}>Name <span className="text-red-500">*</span></label>
                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className={inputClasses} />
              </div>

              {/* Employment Status Info Block */}
              {latestEmployment && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 text-sm mb-1">{latestEmployment.jobTitle} at {latestEmployment.companyName}</h4>
                  <p className="text-xs text-blue-600">To edit go to Employment section.</p>
                  <p className="text-xs text-blue-600 mt-1">Please remove your current employment if you want to mark yourself as fresher</p>
                </div>
              )}

              {/* Work Status */}
              <div>
                <label className={labelClasses}>Work status</label>
                <p className="text-xs text-gray-500 mb-3">We will personalise your Naukri experience based on this</p>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="workStatus" value="Fresher" checked={formData.workStatus === 'Fresher'} onChange={handleWorkStatusChange} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="ml-2 text-sm font-medium">Fresher</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="workStatus" value="Experienced" checked={formData.workStatus === 'Experienced'} onChange={handleWorkStatusChange} className="w-4 h-4 text-primary focus:ring-primary" />
                    <span className="ml-2 text-sm font-medium">Experienced</span>
                  </label>
                </div>
              </div>

              {/* Conditional Fields for Experienced */}
              {formData.workStatus === 'Experienced' && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  {/* Total Experience */}
                  <div>
                    <label className={labelClasses}>Total experience <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">
                      <select value={formData.totalExperience.years} onChange={e => handleNestedChange('totalExperience', 'years', e.target.value)} className={`${inputClasses} bg-white`}>
                        {[...Array(21).keys()].map(i => <option key={i} value={String(i)}>{i} Year{i !== 1 && 's'}</option>)}
                      </select>
                      <select value={formData.totalExperience.months} onChange={e => handleNestedChange('totalExperience', 'months', e.target.value)} className={`${inputClasses} bg-white`}>
                        {[...Array(12).keys()].map(i => <option key={i} value={String(i)}>{i} Month{i !== 1 && 's'}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Current Salary */}
                  <div>
                    <label className={labelClasses}>Current salary <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <select value={formData.currentSalary.currency} onChange={e => handleNestedChange('currentSalary', 'currency', e.target.value)} className={`${inputClasses} w-24 bg-white`}>
                        <option>₹</option>
                        <option>$</option>
                      </select>
                      <input type="text" value={formData.currentSalary.amount} onChange={e => handleNestedChange('currentSalary', 'amount', e.target.value)} placeholder="e.g., 3,00,000" className={inputClasses} />
                    </div>
                  </div>
                  {/* Salary Breakdown */}
                  <div>
                    <label className={labelClasses}>Salary breakdown <span className="text-red-500">*</span></label>
                    <select value={formData.currentSalary.breakdown} onChange={e => handleNestedChange('currentSalary', 'breakdown', e.target.value)} className={`${inputClasses} bg-white`}>
                      <option>Fixed</option>
                      <option>Fixed + Variable</option>
                      <option>Variable</option>
                    </select>
                    <p className="text-xs text-green-600 mt-1 font-medium">Your total salary has been considered as fixed component</p>
                  </div>

                </div>
              )}

              {/* Current Location */}
              {/* Current Location */}
              <div>
                <label className={labelClasses}>Current location <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500 mb-3">This helps us match you to relevant jobs</p>
                <div className="flex gap-6 mb-3">
                  <label className="flex items-center cursor-pointer"><input type="radio" name="inIndia" checked={formData.currentLocation.inIndia} onChange={() => handleNestedChange('currentLocation', 'inIndia', true)} className="w-4 h-4 text-primary focus:ring-primary" /> <span className="ml-2 text-sm font-medium">India</span></label>
                  <label className="flex items-center cursor-pointer"><input type="radio" name="inIndia" checked={!formData.currentLocation.inIndia} onChange={() => handleNestedChange('currentLocation', 'inIndia', false)} className="w-4 h-4 text-primary focus:ring-primary" /> <span className="ml-2 text-sm font-medium">Outside India</span></label>
                </div>

                {formData.currentLocation.inIndia ? (
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.currentLocation.area} // State stored in 'area' to match "District, State" display format
                      onChange={(e) => {
                        const state = e.target.value;
                        handleNestedChange('currentLocation', 'area', state);
                        handleNestedChange('currentLocation', 'city', ''); // Reset district when state changes
                      }}
                      className={`${inputClasses} bg-white appearance-none`}
                    >
                      <option value="">Select State</option>
                      {Object.keys(indianStatesAndDistricts).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <select
                      value={formData.currentLocation.city} // District stored in 'city'
                      onChange={(e) => handleNestedChange('currentLocation', 'city', e.target.value)}
                      disabled={!formData.currentLocation.area}
                      className={`${inputClasses} bg-white appearance-none disabled:bg-gray-100`}
                    >
                      <option value="">Select District</option>
                      {formData.currentLocation.area && indianStatesAndDistricts[formData.currentLocation.area]?.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <input type="text" value={formData.currentLocation.city} onChange={e => handleNestedChange('currentLocation', 'city', e.target.value)} placeholder="City" className={inputClasses} />
                    <input type="text" value={formData.currentLocation.area} onChange={e => handleNestedChange('currentLocation', 'area', e.target.value)} placeholder="Country/Area" className={inputClasses} />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-6">
                {/* Mobile Number */}
                <div>
                  <label className={labelClasses}>Mobile number <span className="text-red-500">*</span></label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-dark-gray">{formData.phone}</span>
                      {formData.isPhoneVerified && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                    </div>
                    <button type="button" onClick={() => handleInitiateVerify('phone')} className="text-sm text-primary font-bold hover:underline">Change</button>
                  </div>
                </div>
                {/* Email Address */}
                <div>
                  <label className={labelClasses}>Email address <span className="text-red-500">*</span></label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-dark-gray">{formData.email}</span>
                      {formData.isEmailVerified && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                    </div>
                    <button type="button" onClick={() => handleInitiateVerify('email')} className="text-sm text-primary font-bold hover:underline">Change</button>
                  </div>
                </div>
                {/* Notice Period */}
                <div>
                  <label className={labelClasses}>Notice period <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {noticePeriods.map(period => (
                      <label key={period} className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-full border transition-all ${formData.noticePeriod === period ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="noticePeriod" value={period} checked={formData.noticePeriod === period} onChange={handleChange} className="sr-only" />
                        {period}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClasses}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputClasses} bg-white`}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Marital Status</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={`${inputClasses} bg-white`}>
                      <option>Single</option>
                      <option>Married</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Address</label>
                  <textarea name="address" value={formData.address} onChange={(e) => handleChange(e)} rows={3} placeholder="Your full address" className={inputClasses} />
                </div>
              </div>

            </div>
            <footer className="px-8 py-5 bg-gray-50 flex justify-end items-center gap-4 rounded-b-2xl border-t">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-bold text-dark-gray hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg">
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
};

export default BasicDetailsModal;
