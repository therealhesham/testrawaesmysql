import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const RevenueChart = ({ data }) => {
  return (
    <div className="h-64">
      <Line
        data={data}
        options={{ responsive: true, maintainAspectRatio: false }}
      />
    </div>
  );
};

export default RevenueChart;
