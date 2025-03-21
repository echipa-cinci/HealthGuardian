
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";

const Patients = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Get current user info (doctor)
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const res = await fetch('/api/auth/status');
      if (!res.ok) throw new Error('Failed to fetch auth status');
      return res.json();
    }
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients', page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/patients?limit=${limit}&offset=${(page - 1) * limit}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
    enabled: !!authData?.authenticated
  });

  const { data: countData } = useQuery({
    queryKey: ['/api/patients/count'],
    queryFn: async () => {
      const res = await fetch('/api/patients/count');
      if (!res.ok) throw new Error('Failed to fetch patient count');
      return res.json();
    },
    enabled: !!authData?.authenticated
  });

  const totalPages = countData ? Math.ceil(countData.count / limit) : 0;
  const [search, setSearch] = useState('');
  const filteredPatients = patients?.filter(patient =>
    `${patient.user?.firstName} ${patient.user?.lastName}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <main className="flex-1 overflow-y-auto bg-neutral-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Patient List</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.user?.firstName} {patient.user?.lastName}</TableCell>
                      <TableCell>{patient.user?.email || patient.email}</TableCell>
                      <TableCell>{patient.phoneNumber}</TableCell>
                      <TableCell>{patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : 'N/A'}</TableCell>
                      <TableCell>{format(new Date(patient.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Link href={`/patient/${patient.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No patients found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                      .map((p, i, arr) => (
                        <PaginationItem key={p}>
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <PaginationItem>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationLink
                            isActive={page === p}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Patients;
