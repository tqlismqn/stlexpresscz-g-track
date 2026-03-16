import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function DriverDetailEdit({ driver, onSave, onCancel, isCreating }) {
  const [formData, setFormData] = useState(
    driver || {
      name: '',
      email: '',
      phone: '',
      status: 'active',
      nationality_group: 'EU',
      date_of_birth: '',
      visa_type: '',
      passport_number: '',
      driving_license_number: '',
      rodne_cislo: '',
      address: '',
      misto_vykonu_prace: 'praha',
      pas_souhlas: false,
      bank_name: '',
      bank_account: ''
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isCreating) {
        // Set company_id from URL or session
        const companies = await base44.entities.Company.list();
        const company = companies[0];
        
        await base44.entities.Driver.create({
          ...formData,
          company_id: company.id
        });
      } else {
        await base44.entities.Driver.update(driver.id, formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 uppercase">Имя</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 uppercase">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 uppercase">Телефон</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 uppercase">Статус</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
          </select>
        </div>
      </div>

      <div className="pt-3 border-t space-y-3">
        <p className="text-xs font-semibold text-gray-700">Национальная группа</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nationality_group"
              value="EU"
              checked={formData.nationality_group === 'EU'}
              onChange={handleChange}
            />
            ЕС
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nationality_group"
              value="non-EU"
              checked={formData.nationality_group === 'non-EU'}
              onChange={handleChange}
            />
            Не-ЕС
          </label>
        </div>
      </div>

      {formData.nationality_group === 'non-EU' && (
        <div className="pt-3 border-t">
          <label className="text-xs text-gray-600 uppercase">Тип визы</label>
          <select
            name="visa_type"
            value={formData.visa_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mt-1"
          >
            <option value="">Выбрать тип</option>
            <option value="povoleni_k_pobytu">Povolení k pobytu</option>
            <option value="vizum">Vizum</option>
            <option value="docasna_ochrana">Dočasná ochrana</option>
            <option value="trvaly_pobyt">Trvalý pobyt</option>
            <option value="vizum_strpeni">Vizum strpení</option>
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          {isCreating ? 'Создать' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}