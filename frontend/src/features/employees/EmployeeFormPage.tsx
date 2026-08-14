import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Skeleton from '../../components/Skeleton';
import {
  createEmployee,
  getEmployee,
  listDepartments,
  listDesignations,
  listSections,
  updateEmployee,
  type Department,
  type Designation,
  type EmployeeCreatePayload,
  type Section,
} from '../../lib/api/employees';
import { useApiMutation } from '../../lib/hooks/useApiMutation';

type FormState = {
  employee_no: string;
  first_name: string;
  last_name: string;
  nic: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | '';
  marital_status: string;
  mobile: string;
  email: string;
  address: string;
  emergency_name: string;
  emergency_tel: string;
  employment_type: EmployeeCreatePayload['employment_type'];
  joined_date: string;
  probation_end: string;
  department_id: string;
  section_id: string;
  designation_id: string;
  basic_salary: string;
  bank_name: string;
  bank_account_no: string;
  bank_branch: string;
  epf_no: string;
  biometric_id: string;
};

const EMPTY_FORM: FormState = {
  employee_no: '',
  first_name: '',
  last_name: '',
  nic: '',
  date_of_birth: '',
  gender: '',
  marital_status: '',
  mobile: '',
  email: '',
  address: '',
  emergency_name: '',
  emergency_tel: '',
  employment_type: 'permanent',
  joined_date: '',
  probation_end: '',
  department_id: '',
  section_id: '',
  designation_id: '',
  basic_salary: '0',
  bank_name: '',
  bank_account_no: '',
  bank_branch: '',
  epf_no: '',
  biometric_id: '',
};

export default function EmployeeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const employeeId = Number(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadingEmployee, setLoadingEmployee] = useState(mode === 'edit');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]));
    listDesignations().then(setDesignations).catch(() => setDesignations([]));
  }, []);

  useEffect(() => {
    if (!form.department_id) {
      setSections([]);
      return;
    }
    listSections(Number(form.department_id))
      .then(setSections)
      .catch(() => setSections([]));
  }, [form.department_id]);

  useEffect(() => {
    if (mode !== 'edit') {
      return;
    }
    getEmployee(employeeId)
      .then((employee) => {
        setForm({
          employee_no: employee.employee_no,
          first_name: employee.first_name,
          last_name: employee.last_name,
          nic: employee.nic,
          date_of_birth: employee.date_of_birth,
          gender: employee.gender,
          marital_status: '',
          mobile: employee.mobile ?? '',
          email: employee.email ?? '',
          address: '',
          emergency_name: '',
          emergency_tel: '',
          employment_type: employee.employment_type,
          joined_date: employee.joined_date,
          probation_end: employee.probation_end ?? '',
          department_id: employee.department_id ? String(employee.department_id) : '',
          section_id: employee.section_id ? String(employee.section_id) : '',
          designation_id: employee.designation_id ? String(employee.designation_id) : '',
          basic_salary: String(employee.basic_salary),
          bank_name: '',
          bank_account_no: '',
          bank_branch: '',
          epf_no: employee.epf_no ?? '',
          biometric_id: employee.biometric_id ?? '',
        });
      })
      .finally(() => setLoadingEmployee(false));
  }, [mode, employeeId]);

  const createMutation = useApiMutation((payload: EmployeeCreatePayload) => createEmployee(payload));
  const updateMutation = useApiMutation((payload: Partial<EmployeeCreatePayload>) => updateEmployee(employeeId, payload));

  const submitting = createMutation.loading || updateMutation.loading;
  const submitError = createMutation.error || updateMutation.error;

  const update = (field: keyof FormState) => (event: { target: { value: string } }) =>
    setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: EmployeeCreatePayload = {
      employee_no: form.employee_no,
      first_name: form.first_name,
      last_name: form.last_name,
      nic: form.nic,
      date_of_birth: form.date_of_birth,
      gender: form.gender as EmployeeCreatePayload['gender'],
      marital_status: form.marital_status ? (form.marital_status as EmployeeCreatePayload['marital_status']) : undefined,
      mobile: form.mobile || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      emergency_name: form.emergency_name || undefined,
      emergency_tel: form.emergency_tel || undefined,
      employment_type: form.employment_type,
      joined_date: form.joined_date,
      probation_end: form.probation_end || undefined,
      department_id: form.department_id ? Number(form.department_id) : undefined,
      section_id: form.section_id ? Number(form.section_id) : undefined,
      designation_id: form.designation_id ? Number(form.designation_id) : undefined,
      basic_salary: form.basic_salary || '0',
      bank_name: form.bank_name || undefined,
      bank_account_no: form.bank_account_no || undefined,
      bank_branch: form.bank_branch || undefined,
      epf_no: form.epf_no || undefined,
      biometric_id: form.biometric_id || undefined,
    };

    if (mode === 'create') {
      const created = await createMutation.mutate(payload);
      navigate(`/employees/${created.id}`);
    } else {
      const { employee_no, ...updatePayload } = payload;
      void employee_no;
      const updated = await updateMutation.mutate(updatePayload);
      navigate(`/employees/${updated.id}`);
    }
  };

  if (loadingEmployee) {
    return <Skeleton rows={8} />;
  }

  return (
    <div>
      <PageHeader
        title={mode === 'create' ? 'Add New Employee' : `Edit ${form.first_name} ${form.last_name}`}
        subtitle="Fill in the details below to keep employee records accurate."
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-section">
          <div className="form-section-title">Personal Details</div>
          <div className="form-grid cols-3">
            <TextField label="Employee No" value={form.employee_no} onChange={update('employee_no')} required disabled={mode === 'edit'} />
            <TextField label="First Name" value={form.first_name} onChange={update('first_name')} required />
            <TextField label="Last Name" value={form.last_name} onChange={update('last_name')} required />
            <TextField label="NIC" value={form.nic} onChange={update('nic')} required disabled={mode === 'edit'} />
            <TextField label="Date of Birth" type="date" value={form.date_of_birth} onChange={update('date_of_birth')} required disabled={mode === 'edit'} />
            <SelectField
              label="Gender"
              value={form.gender}
              onChange={update('gender')}
              required
              disabled={mode === 'edit'}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <SelectField
              label="Marital Status"
              value={form.marital_status}
              onChange={update('marital_status')}
              options={[
                { value: '', label: 'Not specified' },
                { value: 'single', label: 'Single' },
                { value: 'married', label: 'Married' },
                { value: 'divorced', label: 'Divorced' },
                { value: 'widowed', label: 'Widowed' },
              ]}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Contact</div>
          <div className="form-grid cols-3">
            <TextField label="Mobile" value={form.mobile} onChange={update('mobile')} />
            <TextField label="Email" type="email" value={form.email} onChange={update('email')} />
            <TextField label="Address" value={form.address} onChange={update('address')} />
            <TextField label="Emergency Contact Name" value={form.emergency_name} onChange={update('emergency_name')} />
            <TextField label="Emergency Contact Tel" value={form.emergency_tel} onChange={update('emergency_tel')} />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Employment</div>
          <div className="form-grid cols-3">
            <SelectField
              label="Employment Type"
              value={form.employment_type}
              onChange={update('employment_type')}
              required
              options={[
                { value: 'permanent', label: 'Permanent' },
                { value: 'contract', label: 'Contract' },
                { value: 'casual', label: 'Casual' },
                { value: 'trainee', label: 'Trainee' },
              ]}
            />
            <TextField label="Joined Date" type="date" value={form.joined_date} onChange={update('joined_date')} required />
            <TextField label="Probation End" type="date" value={form.probation_end} onChange={update('probation_end')} />
            <SelectField
              label="Department"
              value={form.department_id}
              onChange={(event) => setForm((p) => ({ ...p, department_id: event.target.value, section_id: '' }))}
              options={[{ value: '', label: 'Select department' }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
            />
            <SelectField
              label="Section"
              value={form.section_id}
              onChange={update('section_id')}
              options={[{ value: '', label: 'Select section' }, ...sections.map((s) => ({ value: String(s.id), label: s.name }))]}
            />
            <SelectField
              label="Designation"
              value={form.designation_id}
              onChange={update('designation_id')}
              options={[{ value: '', label: 'Select designation' }, ...designations.map((d) => ({ value: String(d.id), label: d.name }))]}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Salary & Banking</div>
          <div className="form-grid cols-3">
            <TextField label="Basic Salary" type="number" value={form.basic_salary} onChange={update('basic_salary')} required />
            <TextField label="Bank Name" value={form.bank_name} onChange={update('bank_name')} />
            <TextField label="Bank Account No" value={form.bank_account_no} onChange={update('bank_account_no')} />
            <TextField label="Bank Branch" value={form.bank_branch} onChange={update('bank_branch')} />
            <TextField label="EPF No" value={form.epf_no} onChange={update('epf_no')} />
            <TextField label="Biometric ID" value={form.biometric_id} onChange={update('biometric_id')} />
          </div>
        </div>

        {submitError && <div className="auth-error">{submitError}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Save Employee' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
};

function TextField({ label, value, onChange, type = 'text', required, disabled }: TextFieldProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input className="input" type={type} value={value} onChange={onChange} required={required} disabled={disabled} />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
};

function SelectField({ label, value, onChange, options, required, disabled }: SelectFieldProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <select className="input" value={value} onChange={onChange} required={required} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
