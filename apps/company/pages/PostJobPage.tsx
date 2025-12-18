
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postNewJob, updateRecruiterJob, fetchRecruiterJobById } from '../../../packages/api-client';
import { useCompanyAuth } from '../hooks/useCompanyAuth';
import { Job } from '../../../packages/types';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useToast } from '../hooks/useToast';
import { TrashIcon } from '../components/Icons';

// Reusable components for the form
const InputField: React.FC<{ label: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, required?: boolean, type?: string, helperText?: string }> = ({ label, name, type = 'text', helperText, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-dark-gray">{label}{props.required && <span className="text-red-500">*</span>}</label>
        <input id={name} name={name} type={type} {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
        {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
);

const TextAreaField: React.FC<{ label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows?: number, helperText?: string, required?: boolean }> = ({ label, name, helperText, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-dark-gray">{label}{props.required && <span className="text-red-500">*</span>}</label>
        <textarea id={name} name={name} {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
        {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
);

const SelectField: React.FC<{ label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode, required?: boolean }> = ({ label, name, required, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-dark-gray">{label}{required && <span className="text-red-500">*</span>}</label>
        <select id={name} name={name} {...props} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            {props.children}
        </select>
    </div>
);

const FormSection: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="p-6 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-dark-gray">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

interface PostJobPageProps {
    isEditMode?: boolean;
}

const PostJobPage: React.FC<PostJobPageProps> = ({ isEditMode = false }) => {
    const { id: jobId } = useParams();
    const { user, isAuthLoading } = useCompanyAuth();
    const navigate = useNavigate();
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questions, setQuestions] = useState<{ question: string; type: 'text' | 'boolean' }[]>([]);

    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Indian States and Districts Data (Simplified for brevity, can be moved to a separate file)
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

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        skills: '',
        jobType: 'Full-time' as Job['jobType'],
        experience: '',
        educationalQualification: '',
        location: '',
        openings: '1',
        salary: '',
        applicationDeadline: '',
        industry: '',
        department: '',
        perksAndBenefits: '',
        workMode: 'On-site' as Job['workMode'],
        shiftTimings: 'Day' as Job['shiftTimings'],
        noticePeriodPreference: '',
        preferredCandidateLocation: '',
        hiringType: 'Direct' as Job['hiringType'],
        applicationInstructions: '',
        interviewProcessInfo: '',
    });

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const state = e.target.value;
        setSelectedState(state);
        setSelectedDistrict('');
        setFormData(prev => ({ ...prev, location: '' }));
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const district = e.target.value;
        setSelectedDistrict(district);
        if (selectedState && district) {
            setFormData(prev => ({ ...prev, location: `${district}, ${selectedState}` }));
        }
    };

    useEffect(() => {
        const pageTitle = isEditMode ? 'Edit Job' : 'Post Job';
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Jobs', path: '/dashboard/jobs' },
            { name: pageTitle }
        ]);

        if (isEditMode && jobId) {
            fetchRecruiterJobById(jobId).then(({ job }) => {
                setFormData({
                    title: job.title || '',
                    description: job.description || '',
                    skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
                    jobType: job.jobType || 'Full-time',
                    experience: job.experience || '',
                    educationalQualification: job.educationalQualification || '',
                    location: job.location || '',
                    openings: String(job.openings) || '1',
                    salary: job.salary || '',
                    applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
                    industry: job.industry || '',
                    department: job.department || '',
                    perksAndBenefits: Array.isArray(job.perksAndBenefits) ? job.perksAndBenefits.join(', ') : '',
                    workMode: job.workMode || 'On-site',
                    shiftTimings: job.shiftTimings || 'Day',
                    noticePeriodPreference: job.noticePeriodPreference || '',
                    preferredCandidateLocation: job.preferredCandidateLocation || '',
                    hiringType: job.hiringType || 'Direct',
                    applicationInstructions: job.applicationInstructions || '',
                    interviewProcessInfo: job.interviewProcessInfo || '',
                });
                if (job.questions) {
                    setQuestions(job.questions);
                }
                if (job.location) {
                    const parts = job.location.split(',').map(s => s.trim());
                    if (parts.length >= 2) {
                        const state = parts[parts.length - 1];
                        const district = parts.slice(0, parts.length - 1).join(', ');
                        // Verify if state exists in our list
                        if (indianStatesAndDistricts[state]) {
                            setSelectedState(state);
                            setSelectedDistrict(district);
                        }
                    }
                }
            }).catch(err => addToast(`Failed to load job data: ${err.message}`, 'error'));
        }

        return () => setCrumbs([]);
    }, [setCrumbs, isEditMode, jobId, addToast]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            addToast('You must be logged in to post a job.', 'error');
            navigate('/login');
        }
    }, [user, isAuthLoading, navigate, addToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (index: number, field: 'question' | 'type', value: string) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value as any };
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        if (questions.length < 5) {
            setQuestions([...questions, { question: '', type: 'text' }]);
        }
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const jobDataForApi = {
            ...formData,
            skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
            openings: Number(formData.openings) || 1,
            perksAndBenefits: formData.perksAndBenefits.split(',').map(s => s.trim()).filter(Boolean),
            questions: questions.filter(q => q.question.trim() !== ''),
            jobHighlights: formData.description.split('\n').filter(s => s.trim().length > 10).slice(0, 5),
        };

        try {
            if (isEditMode && jobId) {
                await updateRecruiterJob(jobId, jobDataForApi);
                addToast('Job updated successfully!');
            } else {
                // Todo: Change the hard coded message in toast and display the message from backend
                await postNewJob(jobDataForApi);
                addToast('Job posted successfully! It is now pending approval.');
            }
            navigate('/dashboard/jobs');
        } catch (error: any) {
            addToast(`Operation failed: ${error.message}`, 'error');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isAuthLoading || !user) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold text-dark-gray mb-2">{isEditMode ? 'Edit Job' : 'Post a New Job'}</h1>
            <p className="text-gray-600 mb-8">{isEditMode ? 'Update the details for your job posting.' : 'Fill in the details below to find the best talent.'}</p>
            <form onSubmit={handleSubmit} className="space-y-8">

                <FormSection title="Basic Information" subtitle="These are the first details candidates will see.">
                    <InputField label="Job Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Senior React Developer" required />
                    <TextAreaField label="Job Description" name="description" value={formData.description} onChange={handleChange} rows={6} helperText="Provide a detailed description of the role, responsibilities, and requirements." required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField label="Job Type" name="jobType" value={formData.jobType} onChange={handleChange} required>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                        </SelectField>
                        <InputField label="Number of Vacancies" name="openings" value={formData.openings} onChange={handleChange} type="number" required />
                    </div>
                </FormSection>

                <FormSection title="Candidate Requirements" subtitle="Specify the qualifications and experience you're looking for.">
                    <InputField label="Key Skills / Technologies" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. React, TypeScript, Node.js" helperText="Enter skills separated by commas." required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Experience Required" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 3-5 years" required />
                        <InputField label="Educational Qualification" name="educationalQualification" value={formData.educationalQualification} onChange={handleChange} placeholder="e.g. B.Tech in Computer Science" required />
                    </div>
                    <InputField label="Notice Period Preference" name="noticePeriodPreference" value={formData.noticePeriodPreference} onChange={handleChange} placeholder="e.g., Immediate joiner / max 30 days" />
                    <InputField label="Preferred Candidate Location" name="preferredCandidateLocation" value={formData.preferredCandidateLocation} onChange={handleChange} placeholder="e.g., Nearby cities only" />
                </FormSection>

                <FormSection title="Location, Compensation & Logistics" subtitle="Details about where the job is, what it pays, and other logistics.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location Selection: State & District */}
                        <div>
                            <label className="block text-sm font-medium text-dark-gray">Job Location (India Only)<span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <select
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                    required
                                >
                                    <option value="">Select State</option>
                                    {Object.keys(indianStatesAndDistricts).map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedDistrict}
                                    onChange={handleDistrictChange}
                                    disabled={!selectedState}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md disabled:bg-gray-100"
                                    required
                                >
                                    <option value="">Select District</option>
                                    {selectedState && indianStatesAndDistricts[selectedState]?.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Selected: {formData.location || 'None'}</p>
                        </div>
                        <InputField label="Salary / Compensation" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 15,00,000 P.A. or 'Not Disclosed'" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField label="Work Mode" name="workMode" value={formData.workMode} onChange={handleChange}>
                            <option>On-site</option>
                            <option>Remote</option>
                            <option>Hybrid</option>
                        </SelectField>
                        <SelectField label="Shift Timings" name="shiftTimings" value={formData.shiftTimings} onChange={handleChange}>
                            <option>Day</option>
                            <option>Night</option>
                            <option>Rotational</option>
                        </SelectField>
                    </div>
                    <InputField label="Perks & Benefits" name="perksAndBenefits" value={formData.perksAndBenefits} onChange={handleChange} placeholder="e.g. Health Insurance, Free Meals" helperText="Enter perks separated by commas." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Application Deadline" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} type="date" required />
                        <SelectField label="Hiring Type" name="hiringType" value={formData.hiringType} onChange={handleChange}>
                            <option>Direct</option>
                            <option>Agency</option>
                        </SelectField>
                    </div>
                    <TextAreaField label="Application Instructions" name="applicationInstructions" value={formData.applicationInstructions} onChange={handleChange} rows={3} helperText="e.g., “Apply via email to careers@example.com” or “Please upload your portfolio”." />
                </FormSection>

                <FormSection title="Company & Department" subtitle="Help candidates understand where this role fits in your organization.">
                    <InputField label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Software Product" />
                    <InputField label="Department" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Engineering - Software" />
                </FormSection>

                <FormSection title="Screening & Process" subtitle="Help candidates understand your hiring process and screen them effectively.">
                    <div>
                        <label className="block text-sm font-medium text-dark-gray">Screening Questions</label>
                        <p className="mt-1 text-xs text-gray-500">Add up to 5 questions to ask candidates during application.</p>
                        <div className="mt-4 space-y-4">
                            {questions.map((q, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                                    <span className="font-semibold text-gray-500 pt-2">{index + 1}.</span>
                                    <div className="flex-grow space-y-2">
                                        <input
                                            name={`question-${index}`}
                                            value={q.question}
                                            onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                                            placeholder="Enter your question"
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                        <select
                                            name={`question-type-${index}`}
                                            value={q.type}
                                            onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                        >
                                            <option value="text">Text Answer</option>
                                            <option value="boolean">Yes / No</option>
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => removeQuestion(index)} className="mt-2 text-red-500 hover:text-red-700 p-2">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {questions.length < 5 && (
                            <button type="button" onClick={addQuestion} className="mt-4 text-sm font-semibold text-primary hover:underline">
                                + Add another question
                            </button>
                        )}
                    </div>
                    <TextAreaField label="Interview Process Info" name="interviewProcessInfo" value={formData.interviewProcessInfo} onChange={handleChange} rows={3} helperText="e.g., '2 Technical Rounds, 1 HR Round, Online test required.'" />
                </FormSection>

                <div className="flex justify-end pt-4 space-x-4">
                    <button type="button" onClick={() => navigate('/dashboard/jobs')} className="bg-gray-200 text-dark-gray px-6 py-2.5 rounded-md font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-2.5 rounded-md font-semibold hover:bg-primary-dark disabled:bg-gray-400 transition-colors">
                        {isSubmitting ? 'Submitting...' : (isEditMode ? 'Save Changes' : 'Post Job')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostJobPage;
