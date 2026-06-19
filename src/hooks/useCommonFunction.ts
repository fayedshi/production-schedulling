import { useOrderStore } from '../store/order'
import { ElMessage, ElMessageBox } from 'element-plus'

export default function () {
    const store = useOrderStore();
    function handleDelete(row) {
        ElMessageBox.confirm(`确认删除任务 ${row.taskNo} 吗？`, '删除确认', { type: 'warning' })
            .then(() => {
                const ok = store.deleteTaskByNo(row.taskNo)
                ok ? ElMessage.success('任务已删除') : ElMessage.error('删除失败')
            })
            .catch(() => { })
    }
    return { handleDelete };
}