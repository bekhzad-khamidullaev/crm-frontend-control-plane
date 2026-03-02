import React, { useEffect, useMemo, useState } from 'react';
import { Input, Select } from 'antd';
import type { InputProps } from 'antd';

type CountryItem = {
  iso2: string;
  name: string;
  dialCode: string;
};

const COUNTRY_PHONE_CODES: CountryItem[] = [
  { iso2: 'UZ', name: 'Uzbekistan', dialCode: '+998' },
  { iso2: 'RU', name: 'Russia', dialCode: '+7' },
  { iso2: 'KZ', name: 'Kazakhstan', dialCode: '+7' },
  { iso2: 'KG', name: 'Kyrgyzstan', dialCode: '+996' },
  { iso2: 'TJ', name: 'Tajikistan', dialCode: '+992' },
  { iso2: 'TM', name: 'Turkmenistan', dialCode: '+993' },
  { iso2: 'AZ', name: 'Azerbaijan', dialCode: '+994' },
  { iso2: 'AM', name: 'Armenia', dialCode: '+374' },
  { iso2: 'GE', name: 'Georgia', dialCode: '+995' },
  { iso2: 'BY', name: 'Belarus', dialCode: '+375' },
  { iso2: 'UA', name: 'Ukraine', dialCode: '+380' },
  { iso2: 'TR', name: 'Turkey', dialCode: '+90' },
  { iso2: 'AE', name: 'UAE', dialCode: '+971' },
  { iso2: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { iso2: 'US', name: 'USA', dialCode: '+1' },
  { iso2: 'CA', name: 'Canada', dialCode: '+1' },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { iso2: 'DE', name: 'Germany', dialCode: '+49' },
  { iso2: 'FR', name: 'France', dialCode: '+33' },
  { iso2: 'IT', name: 'Italy', dialCode: '+39' },
  { iso2: 'ES', name: 'Spain', dialCode: '+34' },
  { iso2: 'PL', name: 'Poland', dialCode: '+48' },
  { iso2: 'NL', name: 'Netherlands', dialCode: '+31' },
  { iso2: 'CH', name: 'Switzerland', dialCode: '+41' },
  { iso2: 'AT', name: 'Austria', dialCode: '+43' },
  { iso2: 'IN', name: 'India', dialCode: '+91' },
  { iso2: 'PK', name: 'Pakistan', dialCode: '+92' },
  { iso2: 'CN', name: 'China', dialCode: '+86' },
  { iso2: 'JP', name: 'Japan', dialCode: '+81' },
  { iso2: 'KR', name: 'South Korea', dialCode: '+82' },
];

const DEFAULT_COUNTRY = 'UZ';
const DEFAULT_COUNTRY_CONFIG =
  COUNTRY_PHONE_CODES.find((item) => item.iso2 === DEFAULT_COUNTRY) || COUNTRY_PHONE_CODES[0];

const MATCH_BY_LONGEST_CODE = [...COUNTRY_PHONE_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

const toPhoneValue = (dialCode: string, local: string) => {
  const cleanLocal = String(local || '').replace(/\+/g, '').trim();
  return cleanLocal ? `${dialCode} ${cleanLocal}` : '';
};

const parsePhoneValue = (value?: string) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return {
      country: DEFAULT_COUNTRY_CONFIG.iso2,
      local: '',
    };
  }

  if (!raw.startsWith('+')) {
    return {
      country: DEFAULT_COUNTRY_CONFIG.iso2,
      local: raw,
    };
  }

  const matched = MATCH_BY_LONGEST_CODE.find((item) => raw.startsWith(item.dialCode));
  if (!matched) {
    return {
      country: DEFAULT_COUNTRY_CONFIG.iso2,
      local: raw.replace(/^\+/, ''),
    };
  }

  return {
    country: matched.iso2,
    local: raw.slice(matched.dialCode.length).trim(),
  };
};

export interface PhoneInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '90 123 45 67',
  ...inputProps
}) => {
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY_CONFIG.iso2);
  const [localNumber, setLocalNumber] = useState('');

  useEffect(() => {
    const parsed = parsePhoneValue(value);
    setSelectedCountry(parsed.country);
    setLocalNumber(parsed.local);
  }, [value]);

  const selectedCountryConfig = useMemo(
    () =>
      COUNTRY_PHONE_CODES.find((item) => item.iso2 === selectedCountry) || DEFAULT_COUNTRY_CONFIG,
    [selectedCountry]
  );

  const countryOptions = useMemo(
    () =>
      COUNTRY_PHONE_CODES.map((item) => ({
        value: item.iso2,
        label: `${item.name} (${item.dialCode})`,
      })),
    []
  );

  const handleCountryChange = (nextCountry: string) => {
    setSelectedCountry(nextCountry);
    const nextConfig =
      COUNTRY_PHONE_CODES.find((item) => item.iso2 === nextCountry) || DEFAULT_COUNTRY_CONFIG;
    onChange?.(toPhoneValue(nextConfig.dialCode, localNumber));
  };

  const handleLocalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\+/g, '');
    setLocalNumber(raw);
    onChange?.(toPhoneValue(selectedCountryConfig.dialCode, raw));
  };

  return (
    <Input
      {...inputProps}
      value={localNumber}
      onChange={handleLocalChange}
      placeholder={placeholder}
      addonBefore={
        <Select
          value={selectedCountry}
          options={countryOptions}
          onChange={handleCountryChange}
          popupMatchSelectWidth={320}
          showSearch
          optionFilterProp="label"
          style={{ width: 160 }}
        />
      }
    />
  );
};
