import React from 'react';
import { ContactAnalyticsCard } from '../../components/analytics';
import { User, Users, Globe, Phone } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

import { Card } from '../../components/ui/card.jsx';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function ContactsKPI({ contacts = [] }) {
  const stats = {
    total: contacts.length,
    client: contacts.filter((c) => c.type === 'client').length,
    partner: contacts.filter((c) => c.type === 'partner').length,
    supplier: contacts.filter((c) => c.type === 'supplier').length,
    employee: contacts.filter((c) => c.type === 'employee').length,
  };

  const companyCounts = contacts.reduce((acc, contact) => {
    if (contact.company) {
      acc[contact.company] = (acc[contact.company] || 0) + 1;
    }
    return acc;
  }, {});

  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const typeData = {
    labels: ['Клиенты', 'Партнеры', 'Поставщики', 'Сотрудники'],
    datasets: [
      {
        label: 'Количество контактов',
        data: [stats.client, stats.partner, stats.supplier, stats.employee],
        backgroundColor: [
          'rgba(24, 144, 255, 0.8)',
          'rgba(82, 196, 26, 0.8)',
          'rgba(250, 173, 20, 0.8)',
          'rgba(135, 208, 104, 0.8)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(135, 208, 104, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const companiesData = {
    labels: topCompanies.map(([company]) => company),
    datasets: [
      {
        label: 'Количество контактов',
        data: topCompanies.map(([, count]) => count),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  const countryCounts = contacts.reduce((acc, contact) => {
    const country = contact.country || 'Не указано';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const countryData = {
    labels: Object.keys(countryCounts),
    datasets: [
      {
        label: 'Контакты по странам',
        data: Object.values(countryCounts),
        backgroundColor: [
          'rgba(24, 144, 255, 0.6)',
          'rgba(82, 196, 26, 0.6)',
          'rgba(250, 173, 20, 0.6)',
          'rgba(19, 194, 194, 0.6)',
          'rgba(135, 208, 104, 0.6)',
          'rgba(255, 77, 79, 0.6)',
        ],
        borderColor: [
          'rgba(24, 144, 255, 1)',
          'rgba(82, 196, 26, 1)',
          'rgba(250, 173, 20, 1)',
          'rgba(19, 194, 194, 1)',
          'rgba(135, 208, 104, 1)',
          'rgba(255, 77, 79, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const withPhone = contacts.filter((c) => c.phone).length;
  const withEmail = contacts.filter((c) => c.email).length;
  const completeness = stats.total > 0 ? (((withPhone + withEmail) / (stats.total * 2)) * 100).toFixed(1) : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Всего контактов</div>
              <div className="text-lg font-semibold">{stats.total}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-100 p-2 text-emerald-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Клиенты</div>
              <div className="text-lg font-semibold">{stats.client}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-100 p-2 text-amber-700">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">С телефонами</div>
              <div className="text-lg font-semibold">{withPhone}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-sky-100 p-2 text-sky-700">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Полнота данных</div>
              <div className="text-lg font-semibold">{completeness}%</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-semibold">Распределение по типам</div>
          <div className="mt-3 flex h-[300px] items-center justify-center">
            <Doughnut data={typeData} options={chartOptions} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold">Распределение по странам</div>
          <div className="mt-3 flex h-[300px] items-center justify-center">
            <Doughnut data={countryData} options={chartOptions} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold">Топ 10 компаний</div>
          <div className="mt-3 h-[300px]">
            {topCompanies.length > 0 ? (
              <Bar data={companiesData} options={barOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Нет данных о компаниях
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ContactsKPI;
