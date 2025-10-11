import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import AddSpecsForm from 'components/AddSpecsForm';
import AddAvailableForm from 'components/AddAvailableForm';
interface Client {
  id: string;
  fullname: string;
  phonenumber: string;
  city?: string;
}

interface Homemaid {
  id: string;
  Name: string;
  office?: { Country: string };
  religion?: string;
}

export default function OrderFormPage() {
  const router = useRouter();
  const { type, orderId, clientId, clientName, clientPhone, clientCity } = router.query;
  const [clients, setClients] = useState<Client[]>([]);
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preSelectedClient, setPreSelectedClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/autocomplete/clients");
      setClients(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get("/api/autocomplete/homemaids");
      setHomemaids(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClients(), fetchHomemaids()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle pre-selected client from URL parameters
  useEffect(() => {
    if (clientId && clientName && clientPhone) {
      const preSelectedClientData: Client = {
        id: clientId as string,
        fullname: clientName as string,
        phonenumber: clientPhone as string,
        city: clientCity as string || ''
      };
      setPreSelectedClient(preSelectedClientData);
    }
  }, [clientId, clientName, clientPhone, clientCity]);

  const handleCancel = () => {
    router.back(); // Or router.push('/admin/dashboard')
  };

  const handleSuccess = () => {
    router.push('/admin/currentorderstest'); // Refresh will happen via useEffect in Dashboard
  };

  if (isLoading) {
    return <div className="text-center p-6">جارٍ التحميل...</div>;
  }

  if (!type) {
    return <div className="text-center p-6">نوع الطلب غير محدد</div>;
  }

  return (
    <Layout>
      <Head>
        <title>{orderId ? 'تعديل طلب' : 'إضافة طلب جديد'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="text-gray-800">
        {type === 'add-available' && (
          <AddAvailableForm
            clients={clients}
            homemaids={homemaids}
            orderId={orderId as string}
            preSelectedClient={preSelectedClient}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        )}
        {type === 'add-specs' && (
          <AddSpecsForm
            clients={clients}
            orderId={orderId as string}
            preSelectedClient={preSelectedClient}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }: { req: any }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          cookies[key] = decodeURIComponent(value);
        }
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const { jwtDecode } = await import('jwt-decode');
    const { default: prisma } = await import('pages/api/globalprisma');
    const token: any = jwtDecode(cookies.authToken);
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasPermission = findUser && (findUser.role?.permissions as any)?.["إدارة الطلبات"]?.["عرض"];

    if (!hasPermission) {
      return {
        redirect: { destination: "/admin/home", permanent: false },
      };
    }

    return {
      props: {},
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/login", permanent: false },
    };
  }
}